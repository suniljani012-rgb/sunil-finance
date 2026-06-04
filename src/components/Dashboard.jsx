import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CylinderChart } from './CylinderChart';
import { PieChart } from './PieChart';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ShieldAlert, Award } from 'lucide-react';

export const Dashboard = ({ setActiveTab }) => {
  const { fetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/dashboard');
      setStats(data.stats);
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
      <div style={{ padding: '20px', background: 'rgba(244, 63, 94, 0.1)', color: 'hsl(var(--accent-rose))', borderRadius: '12px' }}>
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

  // Prep pie/donut data (Receivable distribution vs Payable distribution)
  const distributionData = [
    { label: 'Available Balance', value: Math.max(stats.currentBalance, 0), colorClass: 'indigo' },
    { label: 'Due to Receive (Loans/Udhaar)', value: stats.toReceive, colorClass: 'violet' },
    { label: 'Due to Pay (Loans/Udhaar)', value: stats.toPay, colorClass: 'amber' },
    { label: 'Expenses Incurred', value: stats.totalExpense, colorClass: 'rose' }
  ];

  return (
    <div className="animate-fade-in">
      {/* Upper Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Financial Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Real-time analysis of your cash flow, loans, and udhaar details.</p>
        </div>
        <button onClick={loadDashboardData} className="btn btn-secondary btn-sm" style={{ fontSize: '13px', padding: '8px 16px' }}>
          Refresh Stats
        </button>
      </div>

      {/* Main Stats Cards Strip */}
      <div className="stats-grid">
        {/* Net Cash Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-indigo))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Available Net Cash</span>
            <span style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.1)', color: 'hsl(var(--accent-indigo))', borderRadius: '50%', display: 'flex' }}>
              <Award size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '12px 0 6px 0', fontWeight: '800' }}>
            ₹{stats.currentBalance.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: stats.currentBalance >= 0 ? 'hsl(var(--accent-emerald))' : 'hsl(var(--accent-rose))', fontSize: '13px', fontWeight: '600' }}>
            {stats.currentBalance >= 0 ? 'Liquidity is healthy' : 'Negative Cash flow alert'}
          </p>
        </div>

        {/* Income Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-emerald))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Income</span>
            <span style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'hsl(var(--accent-emerald))', borderRadius: '50%', display: 'flex' }}>
              <ArrowUpRight size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '12px 0 6px 0', fontWeight: '800', color: 'hsl(var(--accent-emerald))' }}>
            ₹{stats.totalIncome.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total cash inflows recorded</p>
        </div>

        {/* Expense Card */}
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-rose))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total Expenses</span>
            <span style={{ padding: '6px', background: 'rgba(244, 63, 94, 0.1)', color: 'hsl(var(--accent-rose))', borderRadius: '50%', display: 'flex' }}>
              <ArrowDownLeft size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '12px 0 6px 0', fontWeight: '800', color: 'hsl(var(--accent-rose))' }}>
            ₹{stats.totalExpense.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Total spending recorded</p>
        </div>

        {/* Outstanding Receivables */}
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-violet))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total to Receive</span>
            <span style={{ padding: '6px', background: 'rgba(139, 92, 246, 0.1)', color: 'hsl(var(--accent-violet))', borderRadius: '50%', display: 'flex' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '12px 0 6px 0', fontWeight: '800', color: 'hsl(var(--accent-violet))' }}>
            ₹{stats.toReceive.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Unpaid lent money / loans</p>
        </div>

        {/* Outstanding Payables */}
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-amber))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total to Pay</span>
            <span style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.1)', color: 'hsl(var(--accent-amber))', borderRadius: '50%', display: 'flex' }}>
              <ShieldAlert size={18} />
            </span>
          </div>
          <h3 style={{ fontSize: '24px', margin: '12px 0 6px 0', fontWeight: '800', color: 'hsl(var(--accent-amber))' }}>
            ₹{stats.toPay.toLocaleString('en-IN')}
          </h3>
          <p style={{ color: stats.toPay > 0 ? 'hsl(var(--accent-amber))' : 'var(--text-muted)', fontSize: '13px', fontWeight: stats.toPay > 0 ? '600' : 'normal' }}>
            {stats.toPay > 0 ? 'Active liabilities pending' : 'Zero debt liability'}
          </p>
        </div>
      </div>

      {/* Charts Display Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '30px' }}>
        <CylinderChart data={cylinderData} />
        <PieChart data={distributionData} title="Financial Asset & Expense Share" />
      </div>

      {/* Info Tips Panel */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.15)' }}>
        <div style={{ fontSize: '24px' }}>💡</div>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>How Liquidity & Outstanding Balances Work</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            Your <strong>Available Net Cash</strong> is calculated by subtracting your total cash outflows (expenses + lent money + debt repayments made) from your cash inflows (income + debt borrowed + repayments received on loans given). Ensure to record repayments in the <strong>Transactions</strong> panel to keep these outstanding values updated!
          </p>
        </div>
      </div>
    </div>
  );
};
