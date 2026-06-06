import type { BybitBorrowRate, BybitCollateralPosition, BybitLoanSnapshot } from '../domain/bybitTypes';

const API_BASE = 'https://www.bybit.com/x-api/spot/api/fixed-loan/v1';

type BybitEnvelope<T> = {
  ret_code: number;
  ret_msg: string;
  result: T;
  time_now?: string;
};

type UserOverviewResult = {
  currentLTV: string;
  liabilitiesValue: string;
  totalCollateral: string;
  totalFixedBorrow: string;
  totalFlexibleBorrow: string;
  expiringSoonBorrowOrderNumber: number;
};

type LtvConfigResult = {
  initialLtv: string;
  marginCallLtv: string;
  delayedLiquidationLtv: string;
  liquidationLtv: string;
};

type CollateralOverviewResult = {
  coin: string;
  collateralQuantity: string;
  collateralValue: string;
  usdValue: string;
};

type FlexibleBorrowResult = {
  coin: string;
  apr: string;
  hourlyInterestRate: string;
  minimumAmount: string;
};

export type BybitLoanApiResponses = {
  userOverview: BybitEnvelope<UserOverviewResult>;
  ltvConfig: BybitEnvelope<LtvConfigResult>;
  collateralOverview: BybitEnvelope<CollateralOverviewResult[]>;
  flexibleBorrow: BybitEnvelope<FlexibleBorrowResult[]>;
};

export async function fetchBybitLoanSnapshot(): Promise<BybitLoanSnapshot> {
  const [userOverview, ltvConfig, collateralOverview, flexibleBorrow] = await Promise.all([
    fetchBybitJson<BybitEnvelope<UserOverviewResult>>('/user-overview'),
    fetchBybitJson<BybitEnvelope<LtvConfigResult>>('/ltv-config'),
    fetchBybitJson<BybitEnvelope<CollateralOverviewResult[]>>('/user-center/collateral-overview'),
    fetchBybitJson<BybitEnvelope<FlexibleBorrowResult[]>>('/flexible-borrow')
  ]);

  return buildBybitLoanSnapshotFromResponses({
    userOverview,
    ltvConfig,
    collateralOverview,
    flexibleBorrow
  });
}

export function buildBybitLoanSnapshotFromResponses(responses: BybitLoanApiResponses): BybitLoanSnapshot {
  assertOk(responses.userOverview, 'user overview');
  assertOk(responses.ltvConfig, 'LTV config');
  assertOk(responses.collateralOverview, 'collateral overview');
  assertOk(responses.flexibleBorrow, 'flexible borrow rates');

  const overview = responses.userOverview.result;
  const ltvConfig = responses.ltvConfig.result;
  const updatedAt = responses.userOverview.time_now
    ? Number(responses.userOverview.time_now) * 1000
    : Date.now();

  return {
    market: 'Bybit Crypto Loan',
    updatedAt,
    debtUsd: toNumber(overview.liabilitiesValue),
    collateralUsd: toNumber(overview.totalCollateral),
    currentLtvPercent: percentFromRatio(overview.currentLTV),
    totalFlexibleBorrowUsd: toNumber(overview.totalFlexibleBorrow),
    totalFixedBorrowUsd: toNumber(overview.totalFixedBorrow),
    expiringSoonBorrowOrderNumber: Number(overview.expiringSoonBorrowOrderNumber || 0),
    thresholds: {
      initialLtvPercent: percentFromRatio(ltvConfig.initialLtv),
      marginCallLtvPercent: percentFromRatio(ltvConfig.marginCallLtv),
      delayedLiquidationLtvPercent: percentFromRatio(ltvConfig.delayedLiquidationLtv),
      liquidationLtvPercent: percentFromRatio(ltvConfig.liquidationLtv)
    },
    collaterals: responses.collateralOverview.result.map(toCollateralPosition),
    borrowRates: responses.flexibleBorrow.result.map(toBorrowRate)
  };
}

async function fetchBybitJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Bybit API failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function toCollateralPosition(raw: CollateralOverviewResult): BybitCollateralPosition {
  return {
    coin: raw.coin,
    quantity: toNumber(raw.collateralQuantity),
    marketUsdValue: toNumber(raw.collateralValue),
    adjustedUsdValue: toNumber(raw.usdValue)
  };
}

function toBorrowRate(raw: FlexibleBorrowResult): BybitBorrowRate {
  return {
    coin: raw.coin,
    aprPercent: percentFromRatio(raw.apr),
    hourlyInterestRate: toNumber(raw.hourlyInterestRate),
    minimumAmount: toNumber(raw.minimumAmount)
  };
}

function percentFromRatio(value: string): number {
  return toNumber(value) * 100;
}

function toNumber(value: string | number | null | undefined): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function assertOk<T>(envelope: BybitEnvelope<T>, label: string): void {
  if (envelope.ret_code !== 0) {
    throw new Error(`Bybit ${label} error: ${envelope.ret_msg || envelope.ret_code}`);
  }
}
