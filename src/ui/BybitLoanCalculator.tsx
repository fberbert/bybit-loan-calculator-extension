import { Calculator, RefreshCw, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateBorrowRoom,
  calculateLiquidationPrice,
  calculatePortfolio,
  simulateBorrow
} from '../domain/bybitCalculations';
import { formatCrypto, formatPercent, formatUsd } from '../domain/formatters';
import type { BybitLoanSnapshot } from '../domain/bybitTypes';
import { fetchBybitLoanSnapshot } from '../services/bybitLoanClient';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const demoSnapshot: BybitLoanSnapshot = {
  market: 'Bybit Crypto Loan',
  updatedAt: Date.now(),
  debtUsd: 11932.143481686555,
  collateralUsd: 17772.488112146396,
  currentLtvPercent: 67.1383,
  totalFlexibleBorrowUsd: 11932.143481686555,
  totalFixedBorrowUsd: 0,
  expiringSoonBorrowOrderNumber: 0,
  thresholds: {
    initialLtvPercent: 80,
    marginCallLtvPercent: 85,
    delayedLiquidationLtvPercent: 93,
    liquidationLtvPercent: 95
  },
  collaterals: [
    {
      coin: 'BTC',
      quantity: 0.29559021,
      marketUsdValue: 18135.03291012557,
      adjustedUsdValue: 17772.33225192306
    }
  ],
  borrowRates: [
    {
      coin: 'USDT',
      aprPercent: 4.1545479096,
      hourlyInterestRate: 0.0000047426346,
      minimumAmount: 20
    }
  ]
};

export function BybitLoanCalculator() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>('idle');
  const [snapshot, setSnapshot] = useState<BybitLoanSnapshot>(demoSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [newBorrowUsd, setNewBorrowUsd] = useState('1000');
  const [targetLtv, setTargetLtv] = useState('80');
  const refreshInFlightRef = useRef(false);

  const portfolio = useMemo(() => calculatePortfolio(snapshot), [snapshot]);
  const initialBorrowRoom = useMemo(
    () => calculateBorrowRoom(portfolio, snapshot.thresholds.initialLtvPercent),
    [portfolio, snapshot.thresholds.initialLtvPercent]
  );
  const marginCallBorrowRoom = useMemo(
    () => calculateBorrowRoom(portfolio, snapshot.thresholds.marginCallLtvPercent),
    [portfolio, snapshot.thresholds.marginCallLtvPercent]
  );
  const liquidationPrice = useMemo(() => calculateLiquidationPrice(snapshot), [snapshot]);
  const simulation = useMemo(
    () => simulateBorrow(portfolio, Number(newBorrowUsd) || 0, Number(targetLtv) || snapshot.thresholds.initialLtvPercent),
    [newBorrowUsd, portfolio, snapshot.thresholds.initialLtvPercent, targetLtv]
  );
  const primaryCollateral = snapshot.collaterals[0] ?? null;
  const usdtRate = snapshot.borrowRates.find((rate) => rate.coin === 'USDT');

  useEffect(() => {
    if (open && state === 'idle') {
      void refreshLiveData();
    }
  }, [open, state]);

  async function refreshLiveData() {
    if (refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    setState('loading');
    setError(null);

    try {
      const liveSnapshot = await fetchBybitLoanSnapshot();
      setSnapshot(liveSnapshot);
      setState('ready');
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Failed to load Bybit loan data.');
      setState('error');
    } finally {
      refreshInFlightRef.current = false;
    }
  }

  return (
    <div className={`bybit-calc ${open ? 'is-open' : ''}`}>
      <button
        className="bybit-calc__trigger"
        type="button"
        onClick={() => setOpen((value) => !value)}
        title="Open Bybit loan calculator"
        aria-label="Open Bybit loan calculator"
      >
        <Calculator size={22} />
      </button>

      <section className="bybit-calc__panel" aria-label="Bybit loan calculator" onWheel={(event) => event.stopPropagation()}>
        <header className="bybit-calc__header">
          <div>
            <p>Bybit Crypto Loan</p>
            <h2>Loan Calculator</h2>
          </div>
          <div className="bybit-calc__actions">
            <button type="button" onClick={() => void refreshLiveData()} disabled={state === 'loading'} title="Refresh">
              <RefreshCw size={18} />
            </button>
            <button type="button" onClick={() => setOpen(false)} title="Close" aria-label="Close calculator">
              <X size={18} />
            </button>
          </div>
        </header>

        {state === 'loading' && <p className="bybit-calc__notice">Loading Bybit loan data...</p>}
        {error && <p className="bybit-calc__notice bybit-calc__notice--error">{error}</p>}

        <div className="bybit-calc__metrics">
          <Metric label="Debt" value={formatUsd(portfolio.debtUsd)} />
          <Metric label="Collateral" value={formatUsd(portfolio.collateralUsd)} />
          <Metric label="Current LTV" value={formatPercent(portfolio.currentLtvPercent)} tone={portfolio.currentLtvPercent >= 80 ? 'warning' : 'good'} />
          <Metric label={`Room to ${formatPercent(snapshot.thresholds.initialLtvPercent, 0)} LTV`} value={formatUsd(initialBorrowRoom)} />
          <Metric label={`Room to margin call (${formatPercent(snapshot.thresholds.marginCallLtvPercent, 0)})`} value={formatUsd(marginCallBorrowRoom)} tone="warning" />
          <Metric label="BTC liquidation estimate" value={liquidationPrice == null ? '-' : formatUsd(liquidationPrice)} tone="danger" />
        </div>

        <section className="bybit-calc__section">
          <h3>Collateral</h3>
          {primaryCollateral ? (
            <div className="bybit-calc__row">
              <span>{primaryCollateral.coin}</span>
              <strong>{formatCrypto(primaryCollateral.quantity, primaryCollateral.coin)}</strong>
              <small>{formatUsd(primaryCollateral.adjustedUsdValue)} adjusted, {formatUsd(primaryCollateral.marketUsdValue)} market</small>
            </div>
          ) : (
            <p className="bybit-calc__empty">No collateral found.</p>
          )}
        </section>

        <section className="bybit-calc__section bybit-calc__simulator">
          <h3>Borrow simulation</h3>
          <label>
            New borrow in USD
            <input value={newBorrowUsd} inputMode="decimal" onChange={(event) => setNewBorrowUsd(event.target.value)} />
          </label>
          <label>
            Target LTV
            <input value={targetLtv} inputMode="decimal" onChange={(event) => setTargetLtv(event.target.value)} />
          </label>
          <div className="bybit-calc__sim-result">
            <span>Simulated LTV</span>
            <strong>{formatPercent(simulation.simulatedLtvPercent)}</strong>
            <small>{simulation.exceedsTarget ? 'Above target' : `${formatUsd(simulation.remainingBeforeTargetUsd)} remaining before target`}</small>
          </div>
        </section>

        <footer className="bybit-calc__footer">
          <span>{usdtRate ? `USDT flexible APR ${formatPercent(usdtRate.aprPercent)}` : 'Bybit loan APIs'}</span>
          <span>{new Date(snapshot.updatedAt).toLocaleString('pt-BR')}</span>
        </footer>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone?: 'good' | 'warning' | 'danger';
}) {
  return (
    <div className={`bybit-calc__metric ${tone ? `is-${tone}` : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
