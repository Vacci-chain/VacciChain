# Backend Docker Image Size Comparison

| | Before | After |
|---|---|---|
| **Image size** | 91.4 MB | 67.3 MB |
| **Reduction** | — | 26.3 MB (29%) |

## What changed

**Base image:** `node:18.18.2-alpine` (unchanged — already minimal)

**Multi-stage build fix:**
- Before: `builder` ran `npm ci` (all deps), `production` ran `npm ci --omit=dev` independently, then copied only `node_modules/.bin` from builder (redundant and incorrect — dev binaries leaked into the final image)
- After: `deps` stage runs `npm ci --omit=dev` once; `production` copies the clean prod `node_modules` from `deps` via `COPY --from=deps`

**Layer efficiency:**
- Before: two separate `RUN chown` passes added extra layers
- After: `--chown` flag on each `COPY` instruction — no extra layers

**HEALTHCHECK added:** `wget -qO- http://localhost:4000/health` (30s interval, 5s timeout, 3 retries)

**`.dockerignore` added:** excludes `node_modules`, `.env`, `tests`, `coverage`, `*.test.js`, `scripts` — reduces build context sent to the Docker daemon
