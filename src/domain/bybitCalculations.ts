import type { BybitBorrowSimulation, BybitLoanSnapshot, BybitPortfolioSummary } from './bybitTypes';

export function calculatePortfolio(snapshot: BybitLoanSnapshot): BybitPortfolioSummary {
  return {
    debtUsd: snapshot.debtUsd,
    collateralUsd: snapshot.collateralUsd,
    currentLtvPercent: snapshot.currentLtvPercent,
    thresholds: snapshot.thresholds
  };
}

export function calculateBorrowRoom(portfolio: BybitPortfolioSummary, targetLtvPercent: number): number {
  return Math.max(0, portfolio.collateralUsd * (targetLtvPercent / 100) - portfolio.debtUsd);
}

export function calculateLiquidationPrice(snapshot: BybitLoanSnapshot, collateralCoin = 'BTC'): number | null {
  const trackedCollateral = snapshot.collaterals.find(
    (collateral) => collateral.coin.toUpperCase() === collateralCoin.toUpperCase()
  );

  if (!trackedCollateral || trackedCollateral.quantity <= 0 || snapshot.debtUsd <= 0) {
    return null;
  }

  const trackedAdjustedValue = trackedCollateral.adjustedUsdValue;
  const otherAdjustedCollateralUsd = snapshot.collateralUsd - trackedAdjustedValue;
  const requiredAdjustedCollateralUsd = snapshot.debtUsd / (snapshot.thresholds.liquidationLtvPercent / 100);
  const requiredTrackedAdjustedUsd = requiredAdjustedCollateralUsd - otherAdjustedCollateralUsd;

  return requiredTrackedAdjustedUsd <= 0 ? 0 : requiredTrackedAdjustedUsd / trackedCollateral.quantity;
}

export function simulateBorrow(
  portfolio: BybitPortfolioSummary,
  additionalBorrowUsd: number,
  targetLtvPercent: number
): BybitBorrowSimulation {
  const simulatedDebtUsd = portfolio.debtUsd + Math.max(0, additionalBorrowUsd);
  const simulatedLtvPercent =
    portfolio.collateralUsd === 0 ? 0 : (simulatedDebtUsd / portfolio.collateralUsd) * 100;
  const remainingBeforeTargetUsd = portfolio.collateralUsd * (targetLtvPercent / 100) - simulatedDebtUsd;

  return {
    simulatedDebtUsd,
    simulatedLtvPercent,
    remainingBeforeTargetUsd,
    exceedsTarget: remainingBeforeTargetUsd < 0
  };
}
