/**
 * E2E: Issuer → Patient vaccination journey
 *
 * Mocking strategy:
 *  - Freighter: inject window.freighter before the bundle loads so that
 *    @stellar/freighter-api's isConnected/getPublicKey/signTransaction
 *    resolve against the injected object (the library delegates to
 *    window.freighter internally).
 *  - Backend API: Playwright route intercepts replace all /v1/* calls so
 *    the test is fully hermetic (no real Stellar network needed).
 */
import { test, expect } from '@playwright/test';

const ISSUER_KEY    = 'GISSUER0000000000000000000000000000000000000000000000000001';
const PATIENT_KEY   = 'GPATIENT000000000000000000000000000000000000000000000000001';
const MOCK_TOKEN_ID = 'TOKEN-E2E-001';
const VACCINE_NAME  = 'COVID-19 Pfizer';
const DATE_ADM      = '2026-01-15';

test('issuer connects wallet, issues vaccination, patient sees record', async ({ page, context }) => {
  // ── 1. Mock Freighter extension ──────────────────────────────────────────
  // @stellar/freighter-api checks window.freighter for the extension object.
  await context.addInitScript((issuerKey) => {
    window.freighter = {
      isConnected:      () => Promise.resolve({ isConnected: true }),
      getPublicKey:     () => Promise.resolve(issuerKey),
      signTransaction:  (_xdr, _opts) => Promise.resolve('SIGNED_XDR_MOCK'),
      getNetwork:       () => Promise.resolve({ network: 'TESTNET', networkUrl: '' }),
      getNetworkDetails: () => Promise.resolve({ network: 'TESTNET', networkPassphrase: 'Test SDF Network ; September 2015', networkUrl: '' }),
    };
  }, ISSUER_KEY);

  // ── 2. Intercept backend API calls ───────────────────────────────────────
  await context.route('**/v1/auth/sep10', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ transaction: 'MOCK_XDR', nonce: 'mock-nonce' }),
    })
  );

  await context.route('**/v1/auth/verify', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'mock.jwt.issuer', role: 'issuer' }),
    })
  );

  // Issuer authorization status check (called by checkIssuerStatus)
  await context.route('**/v1/vaccination/issuer/status**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authorized: true }),
    })
  );

  await context.route('**/v1/vaccination/issue', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        tokenId: MOCK_TOKEN_ID,
        transactionHash: 'abc123def456',
        vaccine_name: VACCINE_NAME,
        date_administered: DATE_ADM,
        issuer: ISSUER_KEY,
      }),
    })
  );

  // Patient records — return the newly issued record
  await context.route(`**/v1/vaccination/${PATIENT_KEY}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [{
          token_id: MOCK_TOKEN_ID,
          vaccine_name: VACCINE_NAME,
          date_administered: DATE_ADM,
          issuer: ISSUER_KEY,
        }],
        total: 1,
        page: 1,
      }),
    })
  );

  // Consent check — return consented so patient dashboard skips consent screen
  await context.route(`**/v1/patient/consent/${PATIENT_KEY}**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ consented: true }),
    })
  );

  // ── 3. Navigate to issuer dashboard ─────────────────────────────────────
  await page.goto('/issuer');

  // Before connecting, the page shows a connect button
  const connectBtn = page.getByRole('button', { name: /connect.*wallet/i });
  await expect(connectBtn).toBeVisible();

  // ── 4. Connect issuer wallet ─────────────────────────────────────────────
  await connectBtn.click();

  // After connect + SEP-10, the form becomes visible (role=issuer, authorized)
  const form = page.getByRole('form');
  await expect(form).toBeVisible({ timeout: 10_000 });

  // ── 5. Fill the vaccination form ─────────────────────────────────────────
  await page.getByLabel('Patient Stellar Address').fill(PATIENT_KEY);
  await page.getByLabel('Vaccine Name').fill(VACCINE_NAME);
  await page.getByLabel('Date Administered').fill(DATE_ADM);

  // ── 6. Submit ─────────────────────────────────────────────────────────────
  await page.getByRole('button', { name: /issue vaccination nft/i }).click();

  // ── 7. Verify success toast ───────────────────────────────────────────────
  // Toast renders as role="alert" with green background; text from useVaccination:
  // "Vaccination NFT minted! Token ID: ..."
  const toast = page.getByRole('alert').filter({ hasText: /vaccination nft minted/i });
  await expect(toast).toBeVisible({ timeout: 8_000 });

  // ── 8. Switch to patient wallet and navigate to patient dashboard ─────────
  await page.evaluate((patientKey) => {
    window.freighter.getPublicKey = () => Promise.resolve(patientKey);
  }, PATIENT_KEY);

  // Seed localStorage so the patient dashboard auto-reconnects without a click
  await page.evaluate(({ patientKey, token }) => {
    localStorage.setItem('vaccichain_wallet', JSON.stringify({
      publicKey: patientKey,
      token,
      role: 'patient',
    }));
  }, { patientKey: PATIENT_KEY, token: 'mock.jwt.patient' });

  await page.goto('/patient');

  // ── 9. Verify the new record appears ─────────────────────────────────────
  await expect(page.getByText(VACCINE_NAME)).toBeVisible({ timeout: 10_000 });
});
