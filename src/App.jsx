import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { StatementParser } from './components/StatementParser';
import { Reminders } from './components/Reminders';
import { Reports } from './components/Reports';
import { LayoutDashboard, ReceiptText, Upload, BellRing, FileText, LogOut, Wallet, Smartphone, ShieldCheck } from 'lucide-react';
import './App.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // PWA Installation prompt helper states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to PWA install: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <div className="main-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 4px', marginBottom: '8px' }}>
            <img src="/logo.png" alt="FinAura Logo" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1.1' }}>
                Fin<span style={{ color: 'rgb(var(--apple-blue))' }}>Aura</span>
              </h1>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgb(var(--apple-blue))', fontWeight: '700', letterSpacing: '0.08em' }}>Enterprise</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-menu">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <ReceiptText size={16} />
              <span>Ledger Table</span>
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`sidebar-item ${activeTab === 'statement' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Upload size={16} />
              <span>CSV Uploader</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`sidebar-item ${activeTab === 'reminders' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <BellRing size={16} />
              <span>Reminders</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <FileText size={16} />
              <span>Reports Print</span>
            </button>
          </nav>
        </div>

        {/* User Card & Mobile Install */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* PWA Mobile Installation Promo */}
          {showInstallBtn && (
            <button
              onClick={handleInstallClick}
              className="sidebar-item"
              style={{ background: 'rgba(10, 132, 255, 0.1)', color: 'rgb(var(--apple-blue))', border: '1px solid rgba(10, 132, 255, 0.15)', width: '100%' }}
            >
              <Smartphone size={14} />
              <span>Install Mobile App</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgb(var(--apple-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="sidebar-item"
            style={{ background: 'rgba(255, 69, 58, 0.05)', color: 'rgb(var(--apple-red))', border: '1px solid rgba(255, 69, 58, 0.08)', width: '100%', justifyContent: 'center' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'statement' && <StatementParser />}
        {activeTab === 'reminders' && <Reminders />}
        {activeTab === 'reports' && <Reports />}
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
          <Wallet size={40} style={{ color: 'rgb(var(--apple-blue))', animation: 'pulse 1.2s infinite', margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Connecting FinAura...</h2>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Decrypting secure enterprise node</p>
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
