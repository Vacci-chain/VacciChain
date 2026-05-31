/**
 * k6 performance test for GET /v1/verify/public/:wallet
 *
 * Scenarios:
 *   cached   — 100 VUs hit the same wallet repeatedly (cache hit after first request)
 *   uncached — 100 VUs each hit a unique wallet (cache miss every time)
 *
 * Acceptance criteria (issue #350):
 *   cached   p95 < 500 ms
 *   uncached p95 < 2000 ms
 *   error rate < 1 %
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

// One fixed wallet for the cached scenario (all VUs share it → cache warms up fast)
const CACHED_WALLET = 'GBRPYHIL2CI3WHZDTOOQFC6EB4RBMPUTKXWDAUUJQHTITE4K3B6RYTTM';

export const options = {
  scenarios: {
    cached: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      env: { SCENARIO: 'cached' },
      tags: { scenario: 'cached' },
    },
    uncached: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      startTime: '35s', // run after cached scenario finishes
      env: { SCENARIO: 'uncached' },
      tags: { scenario: 'uncached' },
    },
  },
  thresholds: {
    // cached scenario: p95 < 500 ms
    'http_req_duration{scenario:cached}': ['p(95)<500'],
    // uncached scenario: p95 < 2000 ms
    'http_req_duration{scenario:uncached}': ['p(95)<2000'],
    // overall error rate < 1 %
    errors: ['rate<0.01'],
  },
};

export default function () {
  const scenario = __ENV.SCENARIO;

  // For uncached, each VU uses a unique wallet derived from its ID + iteration
  // so the cache never has a warm entry for it.
  const wallet =
    scenario === 'uncached'
      ? uniqueWallet(__VU, __ITER)
      : CACHED_WALLET;

  const res = http.get(`${BASE_URL}/v1/verify/public/${wallet}`, {
    timeout: '10s',
    tags: { scenario },
  });

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'has wallet field': (r) => r.body && r.body.includes('"wallet"'),
  });

  errorRate.add(!ok);
  sleep(0.1);
}

/**
 * Generate a syntactically valid-looking Stellar public key that is unique per
 * VU+iteration so the server cache never has a warm entry for it.
 * The key doesn't need to exist on-chain — the endpoint returns verified:false
 * for unknown wallets, which is still a 200 and exercises the full code path.
 */
function uniqueWallet(vu, iter) {
  const base = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const suffix = String(vu * 10000 + iter).padStart(6, '0');
  // Replace the last characters to keep total length at 56
  return base.slice(0, 50) + suffix;
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
