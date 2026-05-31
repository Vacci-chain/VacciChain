# Setup Guide — VacciChain

This guide walks a new developer from zero to a running local stack on macOS, Linux, and Windows (WSL2).

## Prerequisites

- Git (>=2.30)
- Node.js 18.x (use `nvm` to manage versions)
- Rust (stable) + `wasm32-unknown-unknown` target
- `soroban-cli` (see Soroban docs)
- Python 3.11+
- Docker 23+ and Docker Compose v2
- Freighter wallet browser extension for local testing

## 1. Clone

```bash
git clone https://github.com/dev-fatima-24/VacciChain.git
cd VacciChain
cp .env.example .env
```

## 2. Configure environment variables

Open `.env` and set `HORIZON_URL`, `SOROBAN_RPC_URL`, `ADMIN_SECRET_KEY`, `ADMIN_PUBLIC_KEY`, and `VACCINATIONS_CONTRACT_ID` (if already deployed).

## 3. Install dependencies

### Backend

```bash
cd backend
npm ci
```

### Frontend

```bash
cd ../frontend
npm ci
```

### Python service

```bash
cd ../python-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 4. Build & deploy contract (Testnet)

```bash
cd contracts
rustup target add wasm32-unknown-unknown
make build
# Export keys to env or update .env
make deploy
# Note CONTRACT_ID output — add to .env as VACCINATIONS_CONTRACT_ID
```

Common errors:
- "wasm target missing": run `rustup target add wasm32-unknown-unknown`
- "soroban not found": ensure `soroban-cli` is installed and on PATH

## 5. Run locally with Docker (recommended)

```bash
# from repo root
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Python analytics: http://localhost:8001

## 6. Run without Docker (developer mode)

Open separate terminals:

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev

# python service
cd python-service && uvicorn main:app --port 8001 --reload
```

## 7. Verify installation

- Visit the frontend and connect Freighter (ensure Testnet)
- Use the issuer flow to mint a test record
- Call `GET /verify/:wallet` to confirm on-chain verification

## Troubleshooting

- "Cannot connect to Horizon": verify `HORIZON_URL` and network settings
- "Contract not found": ensure `VACCINATIONS_CONTRACT_ID` is set and contract deployed to the chosen network
- SEP-10 errors: check `SEP10_SERVER_KEY` and system time (NTP)

If you hit a blocker, open an issue including your OS, Node/Rust versions, and the output of the failing command.
