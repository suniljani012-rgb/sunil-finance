import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Landmark, Coins, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const AccountManager = () => {
  const { fetch } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/accounts');
      setAccounts(data.accounts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setError('');
    setSubmitLoading(true);

    try {
      await fetch('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ name, type, balance: Number(balance || 0) })
      });
      setName('');
      setBalance('');
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account? This will unlink transaction histories.")) return;
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    }
  };

  const getAccountIcon = (accType) => {
    switch (accType) {
      case 'bank': return <Landmark size={20} />;
      case 'card': return <CreditCard size={20} />;
      default: return <Coins size={20} />;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
      
      {/* Left side Create form */}
      <div className="glass-card animate-scale-in" style={{ flex: '1', minWidth: '320px', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Register Bank Account / Card
        </h3>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Account Name</label>
            <input type="text" required placeholder="e.g. SBI Checking, HDFC Card, Cash Wallet" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Account Type</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
              <option value="bank">Bank Account</option>
              <option value="card">Credit Card</option>
              <option value="cash">Cash Wallet / Physical Money</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Initial Balance (₹)</label>
            <input type="number" placeholder="Enter starting balance" className="input-field" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>

          <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            {submitLoading ? 'Registering...' : 'Save Account'}
          </button>
        </form>
      </div>

      {/* Right side accounts grid */}
      <div className="glass-card" style={{ flex: '2', minWidth: '360px' }}>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Live Account Balances ({accounts.length})
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Retrieving account logs...</div>
        ) : accounts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '40px 10px', textAlign: 'center' }}>
            No accounts configured yet. Register bank or cash accounts using the form.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {accounts.map(acc => (
              <div key={acc.id} className="glass-card animate-fade-in" style={{ padding: '20px', background: 'rgba(255,255,255,0.015)', position: 'relative' }}>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgb(var(--apple-blue))', padding: '6px', background: 'rgba(10,132,255,0.08)', borderRadius: '8px' }}>
                    {getAccountIcon(acc.type)}
                  </span>
                  
                  <button onClick={() => handleDelete(acc.id)} style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} className="delete-btn-hover">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {acc.name}
                  </h4>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '600' }}>
                    {acc.type}
                  </div>
                </div>

                {/* Balance display */}
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Outstanding Balance</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: acc.balance >= 0 ? '#30d158' : '#ff453a', marginTop: '2px' }}>
                    ₹{acc.balance.toLocaleString('en-IN')}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
