import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Reminders } from './components/Reminders';
import { LayoutDashboard, ReceiptText, BellRing, LogOut, Wallet } from 'lucide-react';
import './App.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="main-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
            <img src="/logo.png" alt="Logo" style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '50%' }} />
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>
              Sunil <span style={{ color: 'hsl(var(--accent-indigo))' }}>Finance</span>
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-menu">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <ReceiptText size={18} />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`sidebar-item ${activeTab === 'reminders' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <BellRing size={18} />
              <span>Reminders</span>
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)',
              color: 'hsl(var(--accent-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="sidebar-item"
            style={{ background: 'rgba(244, 63, 94, 0.05)', color: 'hsl(var(--accent-rose))', border: '1px solid rgba(244, 63, 94, 0.1)', width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'reminders' && <Reminders />}
      </main>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <Wallet size={48} style={{ color: 'hsl(var(--accent-indigo))', animation: 'pulse 1.5s infinite', margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Connecting securely...</h2>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Decrypting financial ledger</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardLayout /> : <Auth />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
