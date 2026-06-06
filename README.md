# Bybit Loan Calculator Extension

Chrome MV3 extension for `https://www.bybit.com/pt-BR/trade/spot/crypto-loan` that adds a compact loan calculator to the Bybit header. The calculator icon is inserted immediately to the left of the `HEADER-DEPOSIT` button.

This is an auxiliary calculation tool, not financial advice.

## What It Shows

- Current debt in USD and BRL.
- Current adjusted collateral value in USD and BRL.
- Current LTV.
- Borrow room up to Bybit's initial LTV.
- Borrow room up to Bybit's liquidation/limit LTV.
- Estimated BTC price that would reach Bybit's liquidation LTV.
- Current collateral quantity and values.
- A borrow simulator for a new USD borrow amount and a target LTV, with BRL equivalents.
- USDT flexible APR when available from Bybit's loan endpoint.

## Data Sources

The content script reads Bybit's own logged-in loan endpoints with `credentials: include`:

```txt
/x-api/spot/api/fixed-loan/v1/user-overview
/x-api/spot/api/fixed-loan/v1/user-center/collateral-overview
/x-api/spot/api/fixed-loan/v1/ltv-config
/x-api/spot/api/fixed-loan/v1/flexible-borrow
```

The extension requires the user to be logged in to Bybit for live account data.

BRL conversion comes from KuCoin public ticker data:

```txt
USDT-BRL
BRL-USDT fallback, inverted
```

The extension uses an MV3 service worker for the KuCoin request so the content script does not depend on the page origin for that price.

## Formulas

```txt
currentLtvPercent = currentLTV * 100
borrowRoom = collateralUsd * targetLtvPercent / 100 - debtUsd
simulatedDebtUsd = debtUsd + newBorrowUsd
simulatedLtvPercent = simulatedDebtUsd / collateralUsd * 100
btcLiquidationPrice = (debtUsd / liquidationLtv) / btcQuantity
```

When Bybit's overview collateral total differs slightly from the individual collateral endpoint, the calculator uses the overview total for LTV and room calculations because that is the aggregate used by Bybit's dashboard.

## Local Installation

```bash
npm install
npm run build
```

Then:

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select either the project root or the `dist` folder.
5. Open `https://www.bybit.com/pt-BR/trade/spot/crypto-loan`.

The build copies `assets/` and `icons/` to the project root so both root loading and `dist` loading work.

## Development

```bash
npm test
npm run build
```

Important files:

```txt
src/ui/BybitLoanCalculator.tsx       React calculator panel
src/content/injectRoot.ts            header placement next to HEADER-DEPOSIT
src/services/bybitLoanClient.ts      Bybit API client and response parser
src/services/priceClient.ts          KuCoin USDT/BRL client
src/services/extensionPriceClient.ts content-script bridge to the service worker
public/assets/background.js          MV3 service worker for KuCoin
src/domain/bybitCalculations.ts      pure LTV, room, liquidation and simulation math
src/domain/bybitTypes.ts             normalized snapshot types
src/styles/extension.css             Shadow DOM styles
```

## Validation

Tests cover:

- parsing Bybit loan API responses into a normalized snapshot;
- debt, collateral and LTV values;
- borrow room at the initial LTV and liquidation/limit LTV thresholds;
- BTC liquidation price estimate;
- new-borrow simulation;
- KuCoin USDT/BRL direct and inverted fallback pricing.
