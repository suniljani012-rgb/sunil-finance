import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, CreditCard, Plus, Trash2, Key } from 'lucide-react';

export const PayeeManager = () => {
  const { fetch } = useAuth();
  const [payees, setPayees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadPayees = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/payees');
      setPayees(data.payees);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setError('');
    setSubmitLoading(true);

    try {
      await fetch('/api/payees', {
        method: 'POST',
        body: JSON.stringify({ name, phone, email, upi_id: upiId, account_number: accountNumber, ifsc })
      });
      // Clear form
      setName('');
      setPhone('');
      setEmail('');
      setUpiId('');
      setAccountNumber('');
      setIfsc('');
      await loadPayees();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact payee? This will reset linked transaction names to uncategorized.")) return;
    try {
      await fetch('/api/payees', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      await loadPayees();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
      
      {/* Left side Form */}
      <div className="glass-card animate-scale-in" style={{ flex: '1', minWidth: '320px', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Register Payee / Contact
        </h3>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" required placeholder="Enter payee name" className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Phone Number</label>
              <input type="text" placeholder="e.g. 9876543210" className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" placeholder="name@email.com" className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">UPI ID (Optional)</label>
            <input type="text" placeholder="username@upi" className="input-field" value={upiId} onChange={e => setUpiId(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Account Number</label>
              <input type="text" placeholder="Bank Account Number" className="input-field" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">IFSC Code</label>
              <input type="text" placeholder="SBIN0001234" className="input-field" value={ifsc} onChange={e => setIfsc(e.target.value.toUpperCase())} />
            </div>
          </div>

          <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            {submitLoading ? 'Registering...' : 'Save Contact'}
          </button>
        </form>
      </div>

      {/* Right side Payee List */}
      <div className="glass-card" style={{ flex: '2', minWidth: '360px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Registered Payees Directory ({payees.length})
        </h3>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading directory...</div>
        ) : payees.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '40px 10px', textAlign: 'center' }}>
            No contacts registered yet. Use the form to add payees.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {payees.map(payee => (
              <div key={payee.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800' }}>{payee.name}</h4>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {payee.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {payee.phone}</div>}
                    {payee.email && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {payee.email}</div>}
                    {payee.upi_id && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Key size={12} /> UPI: {payee.upi_id}</div>}
                    {payee.account_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={12} /> Bank: {payee.account_number} {payee.ifsc ? `(${payee.ifsc})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => handleDelete(payee.id)} style={{ padding: '6px', background: 'rgba(255,69,58,0.1)', border: 'none', borderRadius: '6px', color: 'rgb(var(--apple-red))', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
