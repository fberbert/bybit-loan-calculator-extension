export type BybitCollateralPosition = {
  coin: string;
  quantity: number;
  marketUsdValue: number;
  adjustedUsdValue: number;
};

export type BybitBorrowRate = {
  coin: string;
  aprPercent: number;
  hourlyInterestRate: number;
  minimumAmount: number;
};

export type BybitLtvThresholds = {
  initialLtvPercent: number;
  marginCallLtvPercent: number;
  delayedLiquidationLtvPercent: number;
  liquidationLtvPercent: number;
};

export type BybitLoanSnapshot = {
  market: 'Bybit Crypto Loan';
  updatedAt: number;
  debtUsd: number;
  collateralUsd: number;
  currentLtvPercent: number;
  totalFlexibleBorrowUsd: number;
  totalFixedBorrowUsd: number;
  expiringSoonBorrowOrderNumber: number;
  thresholds: BybitLtvThresholds;
  collaterals: BybitCollateralPosition[];
  borrowRates: BybitBorrowRate[];
};

export type BybitPortfolioSummary = {
  debtUsd: number;
  collateralUsd: number;
  currentLtvPercent: number;
  thresholds: BybitLtvThresholds;
};

export type BybitBorrowSimulation = {
  simulatedDebtUsd: number;
  simulatedLtvPercent: number;
  remainingBeforeTargetUsd: number;
  exceedsTarget: boolean;
};
