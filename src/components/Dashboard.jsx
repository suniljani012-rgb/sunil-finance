import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CylinderChart } from './CylinderChart';
import { PieChart } from './PieChart';
import { AreaChart } from './AreaChart';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ShieldAlert, Award, AlertCircle } from 'lucide-react';

export const Dashboard = ({ setActiveTab }) => {
  const { fetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/dashboard');
      setStats(data.stats);
      
      const txData = await fetch('/api/transactions');
      setTransactions(txData.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
        Loading dashboard analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', borderRadius: '12px' }}>
        Failed to load dashboard: {error}
      </div>
    );
  }

  // Prep cylinder data
  const cylinderData = [
    { label: 'Net Cash', value: stats.currentBalance, colorClass: 'indigo' },
    { label: 'Total Income', value: stats.totalIncome, colorClass: 'emerald' },
    { label: 'Total Expense', value: stats.totalExpense, colorClass: 'rose' },
    { label: 'To Receive', value: stats.toReceive, colorClass: 'violet' },
    { label: 'To Pay', value: stats.toPay, colorClass: 'amber' }
  ];

  // Prep donut data
  const distributionData = [
    { label: 'Net Balance', value: Math.max(stats.currentBalance, 0), colorClass: 'indigo' },
    { label: 'Receivables', value: stats.toReceive, colorClass: 'violet' },
    { label: 'Payables', value: stats.toPay, colorClass: 'amber' },
    { label: 'Expenses', value: stats.totalExpense, colorClass: 'rose' }
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>FinAura Analytics</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time cash flow statement and debt portfolio intelligence.</p>
        </div>
        <button onClick={loadDashboardData} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
          Refresh Ledger
        </button>
      </div>

      {/* Main Stats Cards Strip */}
      <div className="stats-grid">
        {/* Net Cash Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid rgb(var(--apple-blue))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Available Net Cash</span>
            <span style={{ padding: '6px', background: 'rgba(10, 132, 255, 0.1)', color: 'rgb(var(--apple-blue))', borderRadius: '50%', display: 'flex' }}>
              <Award size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '10px 0 4px 0', fontWeight: '800' }}>
            ₹{stats.currentBalance.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: stats.currentBalance >= 0 ? 'rgb(var(--apple-green))' : 'rgb(var(--apple-red))', fontSize: '12px', fontWeight: '700' }}>
            {stats.currentBalance >= 0 ? 'Liquidity is healthy' : 'Cash deficit warning'}
          </p>
        </div>

        {/* Income Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid rgb(var(--apple-green))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Inflows</span>
            <span style={{ padding: '6px', background: 'rgba(48, 209, 88, 0.1)', color: 'rgb(var(--apple-green))', borderRadius: '50%', display: 'flex' }}>
              <ArrowUpRight size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '10px 0 4px 0', fontWeight: '800', color: 'rgb(var(--apple-green))' }}>
            ₹{stats.totalIncome.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Earned & borrowed cash receipts</p>
        </div>

        {/* Expense Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid rgb(var(--apple-red))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Outflows</span>
            <span style={{ padding: '6px', background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', borderRadius: '50%', display: 'flex' }}>
              <ArrowDownLeft size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '10px 0 4px 0', fontWeight: '800', color: 'rgb(var(--apple-red))' }}>
            ₹{stats.totalExpense.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Spent & lent disbursements</p>
        </div>

        {/* Outstanding Receivables */}
        <div className="glass-card" style={{ borderLeft: '4px solid rgb(var(--apple-purple))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Receivables</span>
            <span style={{ padding: '6px', background: 'rgba(191, 90, 242, 0.1)', color: 'rgb(var(--apple-purple))', borderRadius: '50%', display: 'flex' }}>
              <TrendingUp size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '10px 0 4px 0', fontWeight: '800', color: 'rgb(var(--apple-purple))' }}>
            ₹{stats.toReceive.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>Money lent pending recovery</p>
        </div>

        {/* Outstanding Payables */}
        <div className="glass-card" style={{ borderLeft: '4px solid rgb(var(--apple-orange))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Total Liabilities</span>
            <span style={{ padding: '6px', background: 'rgba(255, 159, 10, 0.1)', color: 'rgb(var(--apple-orange))', borderRadius: '50%', display: 'flex' }}>
              <ShieldAlert size={16} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '10px 0 4px 0', fontWeight: '800', color: 'rgb(var(--apple-orange))' }}>
            ₹{stats.toPay.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: stats.toPay > 0 ? 'rgb(var(--apple-orange))' : 'var(--text-secondary)', fontSize: '12px', fontWeight: stats.toPay > 0 ? '700' : 'normal' }}>
            {stats.toPay > 0 ? 'Liabilities requiring action' : 'Zero debt liability'}
          </p>
        </div>
      </div>

      {/* Interactive Cash Flow Trend Area Chart */}
      <div style={{ marginBottom: '24px', display: 'flex' }}>
        <AreaChart transactions={transactions} />
      </div>

      {/* Grid with Donut & Cylinder Charts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
        <CylinderChart data={cylinderData} />
        <PieChart data={distributionData} title="Liquidity & Obligation Split" />
      </div>

      {/* Advice Card */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 132, 255, 0.04)', borderColor: 'rgba(10, 132, 255, 0.1)' }}>
        <AlertCircle size={24} style={{ color: 'rgb(var(--apple-blue))', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '2px' }}>Enterprise Liquidity Protocol</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Your ledger calculations utilize single-source cryptographic signatures to audit assets and obligations. To clear outstanding liabilities, record repayments directly under the <strong>Ledger Table</strong>. Progressive caching stores static views for sub-millisecond execution.
          </p>
        </div>
      </div>
    </div>
  );
};
