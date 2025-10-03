# LifeKey Protocol Frontend

This React application surfaces owner, beneficiary, and claim workflows for the LifeKey Protocol upgradeable smart contract. It uses Vite, wagmi, and viem.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template and fill values:
   ```bash
   cp .env.example .env.local
   ```
   - `VITE_RPC_URL`: HTTPS RPC endpoint for the target chain (e.g., Sepolia).
   - `VITE_CHAIN_ID`: Numeric chain identifier.
   - `VITE_LIFEKEY_PROXY`: Deployed ERC1967 proxy address for `LifeKeyProtocol`.
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/config`: Contract configuration and wagmi setup.
- `src/theme`: Design tokens and global styles derived from the product style guide.
- `src/components`: Shared UI primitives (buttons, inputs, cards, timeline).
- `src/pages`: Route-aligned feature screens for owners, beneficiaries, and claimants.
- `src/hooks`: wagmi-powered data helpers for reading and writing contract state.
- `src/utils`: Pure helpers for address validation and struct normalization.
- `src/assets/abi`: Bundled ABI required for contract calls.

## Key Workflows

- **Owner Console**: Creates and maintains a LifeKey, triggers recoveries, and monitors approvals.
- **Beneficiary Desk**: Lets beneficiaries initiate recoveries, approve active ones, and watch progress.
- **Claim Console**: Guides the proposed owner through finalizing the transfer once all approvals land.

## Design Tokens

Tokens live in `src/theme/tokens.ts` and are exposed via Emotion. Components leverage them directly to mirror the prescribed look and feel.

## Testing & Verification

- Run `npm run build` to ensure the bundle compiles against the configured contract ABI.
- Use `npm run preview` after build for a production preview.
- Recommended: pair with a local anvil fork and the provided Foundry tests to validate contract responses.

