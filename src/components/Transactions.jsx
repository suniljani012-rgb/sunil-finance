import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from './SkeletonLoader';
import { Plus, Trash2, Calendar, User, DollarSign, Tag, Landmark, FileText, Bookmark, CreditCard } from 'lucide-react';

export const Transactions = () => {
  const { fetch } = useAuth();
  
  // Data lists with SWR Local Caching
  const [transactions, setTransactions] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_transactions');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [accounts, setAccounts] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_accounts');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [payees, setPayees] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_payees');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [headers, setHeaders] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_headers');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  
  const [loading, setLoading] = useState(transactions.length === 0);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [personId, setPersonId] = useState('');
  const [accountId, setAccountId] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_accounts');
      const parsed = cached ? JSON.parse(cached) : [];
      return parsed.length > 0 ? parsed[0].id : '';
    } catch {
      return '';
    }
  });
  const [utrNumber, setUtrNumber] = useState('');
  const [status, setStatus] = useState('paid');
  const [dueDate, setDueDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Repayment form states
  const [repayTransaction, setRepayTransaction] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState(() => {
    try {
      const cached = localStorage.getItem('finaura_cache_accounts');
      const parsed = cached ? JSON.parse(cached) : [];
      return parsed.length > 0 ? parsed[0].id : '';
    } catch {
      return '';
    }
  });
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayLoading, setRepayLoading] = useState(false);

  const loadAllData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const txData = await fetch('/api/transactions');
      setTransactions(txData.transactions);
      localStorage.setItem('finaura_cache_transactions', JSON.stringify(txData.transactions));

      const accData = await fetch('/api/accounts');
      setAccounts(accData.accounts);
      localStorage.setItem('finaura_cache_accounts', JSON.stringify(accData.accounts));
      if (accData.accounts.length > 0) {
        if (!accountId) setAccountId(accData.accounts[0].id);
        if (!repayAccount) setRepayAccount(accData.accounts[0].id);
      }

      const payeeData = await fetch('/api/payees');
      setPayees(payeeData.payees);
      localStorage.setItem('finaura_cache_payees', JSON.stringify(payeeData.payees));

      const headData = await fetch('/api/headers');
      setHeaders(headData.headers);
      localStorage.setItem('finaura_cache_headers', JSON.stringify(headData.headers));
      setError('');
    } catch (err) {
      if (transactions.length === 0) {
        setError(err.message);
      }
      console.error('Failed to background sync ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isSilent = transactions.length > 0;
    loadAllData(isSilent);

    const handleSync = () => {
      loadAllData(true);
    };
    window.addEventListener('offline-sync-completed', handleSync);
    return () => window.removeEventListener('offline-sync-completed', handleSync);
  }, []);


  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !accountId) return;
    setError('');
    setSubmitLoading(true);

    try {
      const selectedHeader = headers.find(h => h.id === categoryId);
      const payload = {
        type,
        amount: Number(amount),
        category_id: categoryId || null,
        category: selectedHeader ? selectedHeader.name : 'Uncategorized',
        description,
        person_id: personId || null,
        account_id: accountId,
        utr_number: utrNumber || '',
        status: (type === 'income' || type === 'expense') ? 'paid' : status,
        due_date: (type !== 'income' && type !== 'expense') ? dueDate : ''
      };

      await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Reset
      setAmount('');
      setCategoryId('');
      setDescription('');
      setPersonId('');
      setUtrNumber('');
      setStatus('paid');
      setDueDate('');
      setShowAddForm(false);
      await loadAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction entry? This will reverse bank account balance adjustments!")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      await loadAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!repayTransaction || !repayAmount || !repayAccount) return;
    setError('');
    setRepayLoading(true);

    try {
      await fetch(`/api/transactions/${repayTransaction.id}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(repayAmount),
          payment_date: repayDate,
          account_id: repayAccount
        })
      });

      setRepayAmount('');
      setRepayTransaction(null);
      await loadAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRepayLoading(false);
    }
  };

  const handleTypeChange = (selectedType) => {
    setType(selectedType);
    const relatedHeaders = headers.filter(h => h.type === (selectedType === 'income' ? 'income' : 'expense'));
    if (relatedHeaders.length > 0) {
      setCategoryId(relatedHeaders[0].id);
    } else {
      setCategoryId('');
    }
    
    if (selectedType === 'income' || selectedType === 'expense') {
      setStatus('paid');
    } else {
      setStatus('pending');
    }
  };

  const getBadgeClass = (txType) => {
    switch (txType) {
      case 'income': return 'badge-income';
      case 'expense': return 'badge-expense';
      case 'loan_given': return 'badge-loan-given';
      case 'loan_taken': return 'badge-loan-taken';
      case 'udhar_given': return 'badge-udhar-given';
      case 'udhar_taken': return 'badge-udhar-taken';
      default: return '';
    }
  };

  const formatTxType = (txType) => {
    return txType.replace('_', ' ').toUpperCase();
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    if (filterType === 'loans') return t.type.startsWith('loan_');
    if (filterType === 'udhar') return t.type.startsWith('udhar_');
    return t.type === filterType;
  });

  // Filter category options based on active selection type
  const activeHeaders = headers.filter(h => h.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Ledger Ledger Book</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Add deposits, withdrawals, lending agreements and bank references.</p>
        </div>
        
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
          <Plus size={18} /> Record Transaction
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Filter strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'all', label: 'All Entries' },
          { id: 'income', label: 'Inflows Only' },
          { id: 'expense', label: 'Outflows Only' },
          { id: 'loans', label: 'Loans Only' },
          { id: 'udhar', label: 'Udhaar Only' }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: filterType === btn.id ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
              color: filterType === btn.id ? '#fff' : 'var(--text-secondary)',
              borderColor: filterType === btn.id ? 'rgba(255,255,255,0.2)' : 'var(--border-color)',
              outline: 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Transactions Grid list */}
      {loading && filteredTransactions.length === 0 ? (
        <SkeletonTable columnsCount={6} rowsCount={6} />
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <FileText size={40} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
          <h3>No records found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Log checking entries, cash notes, or loans to display records.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Details / Narration</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Head Category</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Bank Account</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Contact / Payee</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>UTR Number</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Outstanding (Bkaya)</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Due Date</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const isDebt = tx.type.startsWith('loan_') || tx.type.startsWith('udhar_');
                const outstanding = isDebt ? tx.amount - tx.repaid_amount : 0;

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }} className="table-row-hover">
                    {/* Narration */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{tx.description || tx.category}</div>
                      {tx.loan_name && (
                        <div style={{ fontSize: '11px', color: 'rgb(var(--apple-blue))', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
                          <Bookmark size={11} /> Linked Loan: {tx.loan_name} {tx.emi_number ? `(EMI #${tx.emi_number})` : ''}
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${getBadgeClass(tx.type)}`}>
                        {formatTxType(tx.type)}
                      </span>
                    </td>

                    {/* Category Head */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.category_name}
                    </td>

                    {/* Account */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#fff', fontWeight: '500' }}>
                      {tx.account_name}
                    </td>

                    {/* Payee contact */}
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.payee_name || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>

                    {/* UTR reference */}
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {tx.utr_number || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>

                    {/* Outstanding bkaya */}
                    <td style={{ padding: '14px 20px', fontSize: '13px' }}>
                      {isDebt ? (
                        outstanding > 0 ? (
                          <span style={{ color: 'rgb(var(--apple-red))', fontWeight: '700' }}>₹{outstanding.toLocaleString('en-IN')} pending</span>
                        ) : (
                          <span style={{ color: 'rgb(var(--apple-green))', fontWeight: '600' }}>Settled</span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Due date */}
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {tx.due_date ? tx.due_date : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${tx.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                        {tx.status === 'paid' ? 'Settled' : 'Pending'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {isDebt && tx.status === 'pending' && (
                          <button
                            onClick={() => {
                              setRepayTransaction(tx);
                              setRepayAmount(outstanding);
                            }}
                            className="btn"
                            style={{ padding: '4px 8px', fontSize: '11px', background: 'rgba(48,209,88,0.1)', color: 'rgb(var(--apple-green))', border: '1px solid rgba(48,209,88,0.15)' }}
                          >
                            Pay/Repay
                          </button>
                        )}
                        <button onClick={() => handleDelete(tx.id)} style={{ padding: '6px', background: 'rgba(255,69,58,0.08)', border: 'none', borderRadius: '6px', color: 'rgb(var(--apple-red))', cursor: 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record transaction modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Record Financial Entry</h3>
            
            <form onSubmit={handleAddSubmit}>
              {/* Type selector */}
              <div className="input-group">
                <label className="input-label">Entry Type</label>
                <select className="input-field" value={type} onChange={e => handleTypeChange(e.target.value)} style={{ width: '100%' }}>
                  <option value="expense">Expense (Outflow)</option>
                  <option value="income">Income (Inflow)</option>
                  <option value="loan_given">Lent Money / Loan Given (Outflow)</option>
                  <option value="loan_taken">Borrowed Money / Loan Taken (Inflow)</option>
                  <option value="udhar_given">Udhaar Given (Outflow)</option>
                  <option value="udhar_taken">Udhaar Taken (Inflow)</option>
                </select>
              </div>

              {/* Amount & Account selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Amount (₹)</label>
                  <input type="number" required placeholder="0.00" min={1} className="input-field" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Payment Account</label>
                  <select required className="input-field" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (Balance: ₹{acc.balance.toLocaleString('en-IN')})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category selector */}
              <div className="input-group">
                <label className="input-label">Category Head</label>
                <select required className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Select Head Category</option>
                  {activeHeaders.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Payee contact selector */}
              <div className="input-group">
                <label className="input-label">Payee / Contact (Optional)</label>
                <select className="input-field" value={personId} onChange={e => setPersonId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">None</option>
                  {payees.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* UTR reference */}
              <div className="input-group">
                <label className="input-label">Bank Transaction UTR / Ref Number</label>
                <input type="text" placeholder="12-digit UTR reference ID" className="input-field" value={utrNumber} onChange={e => setUtrNumber(e.target.value)} style={{ width: '100%' }} />
              </div>

              {/* Debt configurations (due dates and status) */}
              {type !== 'income' && type !== 'expense' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '12px' }}>
                  <div className="input-group">
                    <label className="input-label">Initial Status</label>
                    <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="paid">Fully Paid</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Repayment Due Date</label>
                    <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="input-group">
                <label className="input-label">Description / Remarks (Optional)</label>
                <textarea className="input-field" placeholder="Narration particulars..." style={{ width: '100%', height: '50px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ flex: '1' }}>
                  {submitLoading ? 'Saving...' : 'Record Entry'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ flex: '1' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayments Modal overlay */}
      {repayTransaction && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Log Settlement Payment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add a payment transaction for <strong>{repayTransaction.description || repayTransaction.category}</strong>.
            </p>
            
            <form onSubmit={handleRepaySubmit}>
              {/* Payment Amount */}
              <div className="input-group">
                <label className="input-label">Payment Amount (₹)</label>
                <input type="number" required min={1} placeholder="Enter paid value" className="input-field" value={repayAmount} onChange={e => setRepayAmount(e.target.value)} style={{ width: '100%' }} />
              </div>

              {/* Bank account used */}
              <div className="input-group">
                <label className="input-label">Debit/Credit Bank Account</label>
                <select required className="input-field" value={repayAccount} onChange={e => setRepayAccount(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Select Bank Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Balance: ₹{acc.balance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              {/* Payment date */}
              <div className="input-group">
                <label className="input-label">Payment Date</label>
                <input type="date" required className="input-field" value={repayDate} onChange={e => setRepayDate(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" disabled={repayLoading} className="btn btn-primary" style={{ flex: '1' }}>
                  {repayLoading ? 'Saving...' : 'Record Payment'}
                </button>
                <button type="button" onClick={() => setRepayTransaction(null)} className="btn btn-secondary" style={{ flex: '1' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
