import { describe, expect, test } from 'vitest';
import {
  calculateBorrowRoom,
  calculateLiquidationPrice,
  calculatePortfolio,
  simulateBorrow
} from '../domain/bybitCalculations';
import { buildBybitLoanSnapshotFromResponses } from '../services/bybitLoanClient';

const userOverviewResponse = {
  ret_code: 0,
  ret_msg: 'ok',
  result: {
    currentLTV: '0.671383',
    liabilitiesValue: '11932.143481686555833596',
    totalBorrow: '11838',
    totalCollateral: '17772.488112146396679735310026387',
    totalFixedBorrow: '0',
    totalFlexibleBorrow: '11932.143481686555833596',
    expiringSoonBorrowOrderNumber: 0
  },
  time_now: '1780736275.375316'
};

const ltvConfigResponse = {
  ret_code: 0,
  ret_msg: 'ok',
  result: {
    initialLtv: '0.8',
    marginCallLtv: '0.85',
    delayedLiquidationLtv: '0.93',
    liquidationLtv: '0.95'
  }
};

const collateralOverviewResponse = {
  ret_code: 0,
  ret_msg: 'ok',
  result: [
    {
      coin: 'BTC',
      collateralQuantity: '0.29559021',
      collateralValue: '18135.0329101255710335050270896',
      usdValue: '17772.332251923059612834926547808'
    }
  ],
  time_now: '1780736274.355538'
};

const flexibleBorrowResponse = {
  ret_code: 0,
  ret_msg: 'ok',
  result: [
    {
      apr: '0.041545479096',
      coin: 'USDT',
      hourlyInterestRate: '0.0000047426346',
      loanPrecision: 4,
      minimumAmount: '20'
    },
    {
      apr: '0.037071031404',
      coin: 'USDC',
      hourlyInterestRate: '0.0000042318529',
      loanPrecision: 4,
      minimumAmount: '20'
    }
  ]
};

describe('Bybit loan calculator', () => {
  test('builds a loan snapshot from Bybit API responses', () => {
    const snapshot = buildBybitLoanSnapshotFromResponses({
      userOverview: userOverviewResponse,
      ltvConfig: ltvConfigResponse,
      collateralOverview: collateralOverviewResponse,
      flexibleBorrow: flexibleBorrowResponse
    });

    expect(snapshot.market).toBe('Bybit Crypto Loan');
    expect(snapshot.debtUsd).toBeCloseTo(11932.143481686555, 8);
    expect(snapshot.collateralUsd).toBeCloseTo(17772.488112146396, 8);
    expect(snapshot.currentLtvPercent).toBeCloseTo(67.1383, 4);
    expect(snapshot.thresholds.initialLtvPercent).toBe(80);
    expect(snapshot.thresholds.marginCallLtvPercent).toBe(85);
    expect(snapshot.thresholds.liquidationLtvPercent).toBe(95);
    expect(snapshot.collaterals[0]).toEqual(
      expect.objectContaining({
        coin: 'BTC',
        quantity: 0.29559021,
        adjustedUsdValue: 17772.33225192306,
        marketUsdValue: 18135.03291012557
      })
    );
    expect(snapshot.borrowRates[0]).toEqual(
      expect.objectContaining({
        coin: 'USDT',
        aprPercent: expect.closeTo(4.1545479096, 10)
      })
    );
  });

  test('calculates Bybit borrow room, liquidation price and borrow simulation', () => {
    const snapshot = buildBybitLoanSnapshotFromResponses({
      userOverview: userOverviewResponse,
      ltvConfig: ltvConfigResponse,
      collateralOverview: collateralOverviewResponse,
      flexibleBorrow: flexibleBorrowResponse
    });
    const portfolio = calculatePortfolio(snapshot);

    expect(portfolio.debtUsd).toBeCloseTo(11932.143481686555, 8);
    expect(calculateBorrowRoom(portfolio, 80)).toBeCloseTo(2285.847008, 5);
    expect(calculateBorrowRoom(portfolio, 85)).toBeCloseTo(3174.471414, 5);
    expect(calculateLiquidationPrice(snapshot)).toBeCloseTo(42491.24, 2);
    expect(simulateBorrow(portfolio, 1000, 80)).toEqual(
      expect.objectContaining({
        simulatedDebtUsd: expect.closeTo(12932.143481686555, 8),
        simulatedLtvPercent: expect.closeTo(72.765, 4),
        exceedsTarget: false
      })
    );
  });
});
