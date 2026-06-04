import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkeletonList } from './SkeletonLoader';
import { Tag, Plus, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const HeaderManager = () => {
  const { fetch } = useAuth();
  const [headers, setHeaders] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_headers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(headers.length === 0);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadHeaders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await fetch('/api/headers');
      setHeaders(data.headers);
      localStorage.setItem('finaura_cache_headers', JSON.stringify(data.headers));
      setError('');
    } catch (err) {
      if (headers.length === 0) {
        setError(err.message);
      }
      console.error('Failed to background sync headers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isSilent = headers.length > 0;
    loadHeaders(isSilent);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setError('');
    setSubmitLoading(true);

    try {
      await fetch('/api/headers', {
        method: 'POST',
        body: JSON.stringify({ name, type })
      });
      setName('');
      await loadHeaders();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category head? Linked transactions will fall back to textual categories.")) return;
    try {
      await fetch('/api/headers', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      await loadHeaders();
    } catch (err) {
      setError(err.message);
    }
  };

  // Split headers
  const incomeHeads = headers.filter(h => h.type === 'income');
  const expenseHeads = headers.filter(h => h.type === 'expense');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
      
      {/* Left side Create form */}
      <div className="glass-card animate-scale-in" style={{ flex: '1', minWidth: '320px', height: 'fit-content' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Create Category Head
        </h3>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Category Name</label>
            <input type="text" required placeholder="e.g. Salary, Rent, Food, Business..." className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Ledger Head Type</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value)}>
              <option value="expense">Expense (Outflow Head)</option>
              <option value="income">Income (Inflow Head)</option>
            </select>
          </div>

          <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
            {submitLoading ? 'Saving...' : 'Add Head'}
          </button>
        </form>
      </div>

      {/* Right side Category list */}
      <div className="glass-card" style={{ flex: '2', minWidth: '360px' }}>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={18} style={{ color: 'rgb(var(--apple-blue))' }} /> Configured Category Heads ({headers.length})
        </h3>

        {loading && headers.length === 0 ? (
          <SkeletonList itemsCount={3} />
        ) : headers.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '40px 10px', textAlign: 'center' }}>
            No category heads configured. Use the form to add one.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Inflow Category list */}
            <div>
              <h4 style={{ fontSize: '14px', color: 'rgb(var(--apple-green))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowUpRight size={14} /> Inflow Heads (Income)
              </h4>
              {incomeHeads.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None registered</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {incomeHeads.map(h => renderHeaderBadge(h))}
                </div>
              )}
            </div>

            {/* Outflow Category list */}
            <div>
              <h4 style={{ fontSize: '14px', color: 'rgb(var(--apple-red))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowDownLeft size={14} /> Outflow Heads (Expenses)
              </h4>
              {expenseHeads.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None registered</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {expenseHeads.map(h => renderHeaderBadge(h))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );

  function renderHeaderBadge(h) {
    return (
      <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{h.name}</span>
        <button onClick={() => handleDelete(h.id)} style={{ padding: '2px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} className="delete-btn-hover">
          <Trash2 size={12} />
        </button>
      </div>
    );
  }
};
