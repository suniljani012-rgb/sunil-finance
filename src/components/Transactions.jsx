import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Calendar, User, DollarSign, Tag, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

export const Transactions = () => {
  const { fetch } = useAuth();
  
  // State variables
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [person, setPerson] = useState('');
  const [status, setStatus] = useState('paid');
  const [dueDate, setDueDate] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Repayment form states
  const [repayTransaction, setRepayTransaction] = useState(null); // transaction object being repaid
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayLoading, setRepayLoading] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/transactions');
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);

    try {
      const payload = {
        type,
        amount: Number(amount),
        category,
        description,
        person: (type !== 'income' && type !== 'expense') ? person : '',
        status: (type === 'income' || type === 'expense') ? 'paid' : status,
        due_date: (type !== 'income' && type !== 'expense') ? dueDate : ''
      };

      await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setPerson('');
      setStatus('pending');
      setDueDate('');
      setShowAddForm(false);
      
      // Reload
      await loadTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      await loadTransactions();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRepaySubmit = async (e) => {
    e.preventDefault();
    if (!repayTransaction || !repayAmount) return;
    setError('');
    setRepayLoading(true);

    try {
      await fetch(`/api/transactions/${repayTransaction.id}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(repayAmount),
          payment_date: repayDate
        })
      });

      setRepayAmount('');
      setRepayTransaction(null);
      await loadTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setRepayLoading(false);
    }
  };

  // Pre-fill categories based on type for convenience
  const handleTypeChange = (selectedType) => {
    setType(selectedType);
    if (selectedType === 'income') {
      setCategory('Salary');
      setStatus('paid');
    } else if (selectedType === 'expense') {
      setCategory('Food & Groceries');
      setStatus('paid');
    } else if (selectedType.startsWith('loan_')) {
      setCategory('Personal Loan');
      setStatus('pending');
    } else if (selectedType.startsWith('udhar_')) {
      setCategory('Udhaar');
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

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Ledger Transactions</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Add income, expenses, lent/borrowed amounts and repayments.</p>
        </div>
        
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
          <Plus size={18} /> Record Entry
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'hsl(var(--accent-rose))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Filter Menu Strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { id: 'all', label: 'All Entries' },
          { id: 'income', label: 'Income Only' },
          { id: 'expense', label: 'Expenses Only' },
          { id: 'loans', label: 'Loans Only' },
          { id: 'udhar', label: 'Udhaar Only' }
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setFilterType(btn.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: filterType === btn.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(12, 18, 37, 0.5)',
              color: filterType === btn.id ? '#fff' : 'var(--text-secondary)',
              borderColor: filterType === btn.id ? 'hsl(var(--accent-indigo))' : 'var(--border-color)',
              outline: 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Transaction List Cards / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading your financial ledger...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
          <h3>No records found</h3>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Try recording a new income, expense, or loan entry to see it here.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Details / Person</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Amount</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Outstanding (Bkaya)</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Due Date</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const isLoanOrUdhar = tx.type.startsWith('loan_') || tx.type.startsWith('udhar_');
                const outstanding = isLoanOrUdhar ? tx.amount - tx.repaid_amount : 0;

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                    {/* Details / Person Name */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>
                        {tx.description || tx.category}
                      </div>
                      {isLoanOrUdhar && tx.person && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <User size={12} /> {tx.person}
                        </div>
                      )}
                    </td>

                    {/* Badge type */}
                    <td style={{ padding: '18px 24px' }}>
                      <span className={`badge ${getBadgeClass(tx.type)}`}>
                        {formatTxType(tx.type)}
                      </span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '18px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {tx.category}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '18px 24px', fontWeight: '700', color: '#fff', fontSize: '15px' }}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Outstanding (Bkaya) */}
                    <td style={{ padding: '18px 24px', fontSize: '14px' }}>
                      {isLoanOrUdhar ? (
                        outstanding > 0 ? (
                          <span style={{ color: 'hsl(var(--accent-rose))', fontWeight: '700' }}>
                            ₹{outstanding.toLocaleString('en-IN')} pending
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--accent-emerald))', fontWeight: '600' }}>
                            Settled
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '18px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.due_date ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} /> {tx.due_date}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '18px 24px' }}>
                      <span className={`badge ${tx.status === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                        {tx.status === 'paid' ? 'Settled' : 'Pending'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '18px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {isLoanOrUdhar && tx.status === 'pending' && (
                          <button
                            onClick={() => setRepayTransaction(tx)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                              color: 'hsl(var(--accent-emerald))',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            Pay/Repay
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tx.id)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.15)',
                            color: 'hsl(var(--accent-rose))',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
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

      {/* Record Entry Modal overlay */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Record New Financial Entry</h3>
            
            <form onSubmit={handleAddSubmit}>
              {/* Type Select */}
              <div className="input-group">
                <label className="input-label">Entry Type</label>
                <select
                  className="input-field"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="expense">Expense (Outflow)</option>
                  <option value="income">Income (Inflow)</option>
                  <option value="loan_given">Lent Money / Loan Given (Outflow)</option>
                  <option value="loan_taken">Borrowed Money / Loan Taken (Inflow)</option>
                  <option value="udhar_given">Udhaar Given (Outflow)</option>
                  <option value="udhar_taken">Udhaar Taken (Inflow)</option>
                </select>
              </div>

              {/* Amount input */}
              <div className="input-group">
                <label className="input-label">Amount (₹)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="Enter amount"
                    className="input-field"
                    style={{ paddingLeft: '36px', width: '100%' }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Category input */}
              <div className="input-group">
                <label className="input-label">Category</label>
                <div style={{ position: 'relative' }}>
                  <Tag size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Salary, Rent, Groceries, Shopping, Travel..."
                    className="input-field"
                    style={{ paddingLeft: '36px', width: '100%' }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              {/* Person Name (for Loan/Udhaar) */}
              {(type.startsWith('loan_') || type.startsWith('udhar_')) && (
                <div className="input-group">
                  <label className="input-label">Person Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      placeholder="Enter contact person name"
                      className="input-field"
                      style={{ paddingLeft: '36px', width: '100%' }}
                      value={person}
                      onChange={(e) => setPerson(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Due Date (for Loan/Udhaar) */}
              {(type.startsWith('loan_') || type.startsWith('udhar_')) && (
                <div className="input-group">
                  <label className="input-label">Repayment Due Date (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                    <input
                      type="date"
                      className="input-field"
                      style={{ paddingLeft: '36px', width: '100%' }}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Initial Status (for Loan/Udhaar) */}
              {(type.startsWith('loan_') || type.startsWith('udhar_')) && (
                <div className="input-group">
                  <label className="input-label">Initial Status</label>
                  <select
                    className="input-field"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="pending">Pending (Unsettled / Outstanding)</option>
                    <option value="paid">Fully Paid (Settled Immediately)</option>
                  </select>
                </div>
              )}

              {/* Description */}
              <div className="input-group">
                <label className="input-label">Remarks / Description (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="Add details..."
                  style={{ width: '100%', height: '60px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ flex: '1' }}>
                  {submitLoading ? 'Recording...' : 'Save Entry'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ flex: '1' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay / Payment Modal overlay */}
      {repayTransaction && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Log Repayment / Settlement</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Recording a payment against <strong>{repayTransaction.description || repayTransaction.category}</strong> 
              {repayTransaction.person && ` for ${repayTransaction.person}`}.
            </p>
            
            <form onSubmit={handleRepaySubmit}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Total Loan Amount:</span>
                  <span style={{ fontWeight: 'bold' }}>₹{repayTransaction.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Already Repaid:</span>
                  <span style={{ fontWeight: 'bold', color: 'hsl(var(--accent-emerald))' }}>₹{repayTransaction.repaid_amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '6px', fontWeight: '700' }}>
                  <span>Outstanding (Bkaya):</span>
                  <span style={{ color: 'hsl(var(--accent-rose))' }}>₹{(repayTransaction.amount - repayTransaction.repaid_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Repay Amount */}
              <div className="input-group">
                <label className="input-label">Repayment Amount (₹)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={repayTransaction.amount - repayTransaction.repaid_amount}
                  placeholder="Enter amount paid"
                  className="input-field"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Repay Date */}
              <div className="input-group">
                <label className="input-label">Payment Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Actions */}
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
