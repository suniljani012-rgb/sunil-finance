import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { StatementParser } from './components/StatementParser';
import { LoanTracker } from './components/LoanTracker';
import { PayeeManager } from './components/PayeeManager';
import { AccountManager } from './components/AccountManager';
import { HeaderManager } from './components/HeaderManager';
import { Reports } from './components/Reports';
import { ScreenLock } from './components/ScreenLock';
import { LayoutDashboard, ReceiptText, Upload, Landmark, User, CreditCard, Tag, FileText, LogOut, Wallet, Smartphone, ShieldCheck, Sun, Moon } from 'lucide-react';
import './App.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // App Lock states
  const [isLocked, setIsLocked] = useState(localStorage.getItem('app_lock_enabled') === 'true');
  const [appLockEnabled, setAppLockEnabled] = useState(localStorage.getItem('app_lock_enabled') === 'true');
  const [showSetupLock, setShowSetupLock] = useState(false);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    // Theme effect
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // PWA banner listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAppLockToggle = () => {
    if (appLockEnabled) {
      localStorage.removeItem('app_lock_pin');
      localStorage.removeItem('app_lock_enabled');
      localStorage.removeItem('biometric_credential_id');
      setAppLockEnabled(false);
      setIsLocked(false);
    } else {
      setShowSetupLock(true);
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User choice PWA: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // If locked, render screen lock overlay
  if (isLocked) {
    return <ScreenLock user={user} onUnlock={() => setIsLocked(false)} />;
  }

  // If setting up app lock
  if (showSetupLock) {
    return (
      <ScreenLock 
        user={user} 
        forceSetup={true} 
        onUnlock={() => {
          setShowSetupLock(false);
          setAppLockEnabled(true);
          setIsLocked(false);
        }} 
      />
    );
  }

  return (
    <div className="main-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          {/* Brand Header with Toggle Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="FinAura Logo" style={{ height: '36px', width: '36px', objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1.1' }}>
                  Fin<span style={{ color: 'rgb(var(--apple-blue))' }}>Aura</span>
                </h1>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'rgb(var(--apple-blue))', fontWeight: '700', letterSpacing: '0.08em' }}>Enterprise</span>
              </div>
            </div>
            
            {/* Quick Actions (Theme & App Lock) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={toggleTheme} 
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }} 
                title="Toggle Light/Dark Theme"
              >
                {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              </button>
              <button 
                onClick={handleAppLockToggle} 
                style={{ 
                  background: appLockEnabled ? 'rgba(10, 132, 255, 0.1)' : 'rgba(255,255,255,0.05)', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: appLockEnabled ? 'rgb(var(--apple-blue))' : 'var(--text-primary)' 
                }} 
                title={appLockEnabled ? "Disable Screen Lock" : "Enable Screen Lock (Fingerprint/PIN)"}
              >
                <ShieldCheck size={13} />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-menu">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <ReceiptText size={15} />
              <span>Ledger Book</span>
            </button>

            <button
              onClick={() => setActiveTab('statement')}
              className={`sidebar-item ${activeTab === 'statement' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Upload size={15} />
              <span>CSV Uploader</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`sidebar-item ${activeTab === 'loans' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Landmark size={15} />
              <span>Loans & EMI</span>
            </button>

            <button
              onClick={() => setActiveTab('payees')}
              className={`sidebar-item ${activeTab === 'payees' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <User size={15} />
              <span>Payee Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`sidebar-item ${activeTab === 'accounts' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <CreditCard size={15} />
              <span>Bank Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('headers')}
              className={`sidebar-item ${activeTab === 'headers' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Tag size={15} />
              <span>Category Heads</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <FileText size={15} />
              <span>Print Reports</span>
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

          {/* Android Native APK direct download link */}
          <a
            href="/FinAura.apk"
            download="FinAura.apk"
            className="sidebar-item"
            style={{ 
              background: 'rgba(48, 209, 88, 0.1)', 
              color: 'rgb(var(--apple-green))', 
              border: '1px solid rgba(48, 209, 88, 0.15)', 
              width: '100%',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Smartphone size={14} />
            <span>Download Android APK</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)',
              color: 'rgb(var(--apple-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px'
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        {activeTab === 'loans' && <LoanTracker />}
        {activeTab === 'payees' && <PayeeManager />}
        {activeTab === 'accounts' && <AccountManager />}
        {activeTab === 'headers' && <HeaderManager />}
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
