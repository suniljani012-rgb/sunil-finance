import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Calendar, Percent, Plus, Trash2, ArrowUpRight, DollarSign, ListCollapse, Bookmark, CreditCard } from 'lucide-react';

export const LoanTracker = () => {
  const { fetch } = useAuth();
  
  // Data lists
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Loan Form states
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [lender, setLender] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // EMI Repayment states
  const [repayLoan, setRepayLoan] = useState(null); // loan object being repaid
  const [payAmount, setPayAmount] = useState('');
  const [payAccount, setPayAccount] = useState('');
  const [payUtr, setPayUtr] = useState('');
  const [payEmiNum, setPayEmiNum] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayLoading, setRepayLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const loanData = await fetch('/api/loans');
      setLoans(loanData.loans);
      
      const accData = await fetch('/api/accounts');
      setAccounts(accData.accounts);
      if (accData.accounts.length > 0) {
        setPayAccount(accData.accounts[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (!name || !totalAmount || !emiAmount || !lender || !startDate) return;
    setError('');
    setSubmitLoading(true);

    try {
      await fetch('/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          total_amount: Number(totalAmount),
          emi_amount: Number(emiAmount),
          interest_rate: Number(interestRate || 0),
          tenure_months: Number(tenure || 12),
          lender,
          start_date: startDate,
          due_day: Number(dueDay || 1)
        })
      });

      // Clear Form
      setName('');
      setTotalAmount('');
      setEmiAmount('');
      setInterestRate('');
      setTenure('');
      setLender('');
      setStartDate('');
      setDueDay('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLoan = async (id) => {
    if (!window.confirm("Delete this loan facility? Linked EMI transaction histories will not be deleted, but will be unlinked.")) return;
    try {
      await fetch('/api/loans', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePayEmiSubmit = async (e) => {
    e.preventDefault();
    if (!repayLoan || !payAmount || !payAccount) return;
    setError('');
    setRepayLoading(true);

    try {
      // Record a transaction of type 'expense' representing the EMI payment
      // Link it to the target account, loan, and set UTR and EMI numbers
      await fetch('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type: 'expense',
          amount: Number(payAmount),
          category: 'EMI Payment',
          description: `EMI Payment #${payEmiNum || 'Installment'} for ${repayLoan.name}`,
          account_id: payAccount,
          utr_number: payUtr || '',
          loan_id: repayLoan.id,
          emi_number: payEmiNum ? Number(payEmiNum) : null,
          status: 'paid',
          due_date: payDate
        })
      });

      setPayAmount('');
      setPayUtr('');
      setPayEmiNum('');
      setRepayLoan(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setRepayLoading(false);
    }
  };

  const openEmiModal = (loan) => {
    setRepayLoan(loan);
    setPayAmount(loan.emi_amount);
    // Attempt to guess next EMI number
    const guessedEmi = Math.round(loan.total_repaid_repayments / loan.emi_amount) + 1;
    setPayEmiNum(guessedEmi);
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Loans & EMI Tracker</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Register active loan liabilities, monitor dynamic repayment progress bars, and log monthly EMIs.</p>
        </div>
        
        <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
          <Plus size={18} /> Register Loan Facility
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Dynamic Loan progress widgets grid */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)', padding: '20px' }}>Loading loan books...</div>
      ) : loans.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Landmark size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
          <h3>No active loan facilities</h3>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Add a car loan, home loan, or personal borrowing to track EMIs here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {loans.map(loan => {
            const outstanding = Math.max(loan.total_amount - loan.total_repaid_repayments, 0);
            const progressPercent = Math.min((loan.total_repaid_repayments / loan.total_amount) * 100, 100);

            return (
              <div key={loan.id} className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Upper strip */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800' }}>{loan.name}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Lender: <strong>{loan.lender}</strong></p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => openEmiModal(loan)} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                      Log EMI Repayment
                    </button>
                    <button onClick={() => handleDeleteLoan(loan.id)} style={{ padding: '6px', background: 'rgba(255,69,58,0.1)', border: 'none', borderRadius: '6px', color: 'rgb(var(--apple-red))', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Repayment Progress ({progressPercent.toFixed(1)}%)</span>
                    <span>₹{loan.total_repaid_repayments.toLocaleString('en-IN')} paid of ₹{loan.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPercent}%`, background: 'rgb(var(--apple-blue))', borderRadius: '4px', transition: 'width 0.3s' }}></div>
                  </div>
                </div>

                {/* Loan terms grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Outstanding (Bkaya)</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'rgb(var(--apple-red))', marginTop: '2px' }}>
                      ₹{outstanding.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Monthly EMI Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                      ₹{loan.emi_amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Interest Rate</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Percent size={13} /> {loan.interest_rate}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tenure Period</div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                      {loan.tenure_months} Months
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Start Date</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginTop: '2px' }}>
                      {loan.start_date}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>EMI Due Day</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'rgb(var(--apple-orange))', marginTop: '2px' }}>
                      {loan.due_day || 1}th of Month
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Loan Modal form */}
      {showAddForm && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Register Loan Facility</h3>
            
            <form onSubmit={handleCreateLoan}>
              <div className="input-group">
                <label className="input-label">Loan Account Name</label>
                <input type="text" required placeholder="e.g. HDFC Home Loan, SBI Car Loan" className="input-field" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="input-group">
                <label className="input-label">Lender (Bank / Person)</label>
                <input type="text" required placeholder="Lender organization or name" className="input-field" value={lender} onChange={e => setLender(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Total Loan Sanctioned (₹)</label>
                  <input type="number" required placeholder="Principal Amount" className="input-field" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Monthly EMI Amount (₹)</label>
                  <input type="number" required placeholder="EMI Value" className="input-field" value={emiAmount} onChange={e => setEmiAmount(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Interest Rate (%)</label>
                  <input type="number" step="0.01" placeholder="e.g. 8.75" className="input-field" value={interestRate} onChange={e => setInterestRate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Tenure (Months)</label>
                  <input type="number" placeholder="Months tenure" className="input-field" value={tenure} onChange={e => setTenure(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Loan Start Date</label>
                  <input type="date" required className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">EMI Due Day of Month</label>
                  <input type="number" min={1} max={31} placeholder="e.g. 5" className="input-field" value={dueDay} onChange={e => setDueDay(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" disabled={submitLoading} className="btn btn-primary" style={{ flex: '1' }}>
                  {submitLoading ? 'Saving...' : 'Register Loan'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary" style={{ flex: '1' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record EMI payment Modal */}
      {repayLoan && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '440px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Record EMI Installment Payment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Logging a cash payment against <strong>{repayLoan.name}</strong>.
            </p>

            <form onSubmit={handlePayEmiSubmit}>
              {/* Payment Amount */}
              <div className="input-group">
                <label className="input-label">Payment Amount (₹)</label>
                <input type="number" required placeholder="Repayment value" className="input-field" value={payAmount} onChange={e => setPayAmount(e.target.value)} style={{ width: '100%' }} />
              </div>

              {/* Bank Account choice */}
              <div className="input-group">
                <label className="input-label">Source Bank Account</label>
                <select required className="input-field" value={payAccount} onChange={e => setPayAccount(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Balance: ₹{acc.balance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              {/* EMI number and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">EMI Number</label>
                  <input type="number" placeholder="e.g. 5" className="input-field" value={payEmiNum} onChange={e => setPayEmiNum(e.target.value)} />
                </div>
                <div className="input-group">
                  <label className="input-label">Payment Date</label>
                  <input type="date" required className="input-field" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
              </div>

              {/* UTR Number */}
              <div className="input-group">
                <label className="input-label">Transaction UTR / Reference ID</label>
                <input type="text" placeholder="Bank transaction Reference number" className="input-field" value={payUtr} onChange={e => setPayUtr(e.target.value)} style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" disabled={repayLoading} className="btn btn-primary" style={{ flex: '1' }}>
                  {repayLoading ? 'Saving...' : 'Record Payment'}
                </button>
                <button type="button" onClick={() => setRepayLoan(null)} className="btn btn-secondary" style={{ flex: '1' }}>
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
