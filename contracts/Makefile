build:
	cargo build --target wasm32-unknown-unknown --release
	@echo "WASM artifact: target/wasm32-unknown-unknown/release/vaccichain.wasm"

test:
	cargo test

test-coverage:
	cargo tarpaulin --fail-under 85 --out Xml

deploy:
	@echo "Deploying to Stellar testnet..."
	$(eval CONTRACT_ID := $(shell soroban contract deploy \
		--wasm target/wasm32-unknown-unknown/release/vaccichain.wasm \
		--source $(ADMIN_SECRET_KEY) \
		--network testnet))
	@echo "CONTRACT_ID=$(CONTRACT_ID)"
	@echo "Writing contract ID to ../.env..."
	@sed -i 's|^VACCINATIONS_CONTRACT_ID=.*|VACCINATIONS_CONTRACT_ID=$(CONTRACT_ID)|' ../.env 2>/dev/null || \
		echo "VACCINATIONS_CONTRACT_ID=$(CONTRACT_ID)" >> ../.env
	@echo "Running smoke test..."
	@VACCINATIONS_CONTRACT_ID=$(CONTRACT_ID) \
	 ADMIN_SECRET_KEY=$(ADMIN_SECRET_KEY) \
	 ADMIN_PUBLIC_KEY=$(ADMIN_PUBLIC_KEY) \
	 bash ../scripts/smoke-test.sh
	@echo "Deploy complete. CONTRACT_ID=$(CONTRACT_ID)"

clean:
	cargo clean

.PHONY: build test deploy clean
