import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, DollarSign, Clock, AlertTriangle, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

export const Reminders = () => {
  const { fetch } = useAuth();
  
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Repayment form inside reminders
  const [repayTransaction, setRepayTransaction] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0]);
  const [repayLoading, setRepayLoading] = useState(false);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await fetch('/api/reminders');
      setReminders(data.reminders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

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
      await loadReminders();
    } catch (err) {
      setError(err.message);
    } finally {
      setRepayLoading(false);
    }
  };

  const getUrgencyState = (dueDateStr) => {
    if (!dueDateStr) return 'upcoming';
    
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const dueDate = new Date(dueDateStr);
    
    if (dueDateStr === todayStr) {
      return 'today';
    } else if (dueDate < today) {
      return 'overdue';
    }
    return 'upcoming';
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'overdue':
        return (
          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.12)', color: 'hsl(var(--accent-rose))', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <AlertCircle size={12} style={{ marginRight: '4px' }} /> OVERDUE
          </span>
        );
      case 'today':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'hsl(var(--accent-amber))', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <AlertTriangle size={12} style={{ marginRight: '4px' }} /> DUE TODAY
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'hsl(var(--accent-indigo))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Clock size={12} style={{ marginRight: '4px' }} /> UPCOMING
          </span>
        );
    }
  };

  // Group reminders
  const overdueReminders = reminders.filter(r => getUrgencyState(r.due_date) === 'overdue');
  const todayReminders = reminders.filter(r => getUrgencyState(r.due_date) === 'today');
  const upcomingReminders = reminders.filter(r => getUrgencyState(r.due_date) === 'upcoming');

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Payment Reminders</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Keep track of deadlines for lent and borrowed money settlements.</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'hsl(var(--accent-rose))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-rose))', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Overdue Bills</div>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: overdueReminders.length > 0 ? 'hsl(var(--accent-rose))' : '#fff' }}>
            {overdueReminders.length}
          </div>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-amber))', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Due Today</div>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0', color: todayReminders.length > 0 ? 'hsl(var(--accent-amber))' : '#fff' }}>
            {todayReminders.length}
          </div>
        </div>
        <div className="glass-card" style={{ borderLeft: '4px solid hsl(var(--accent-indigo))', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Upcoming Deadlines</div>
          <div style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 0 0' }}>
            {upcomingReminders.length}
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading payment reminders...
        </div>
      ) : reminders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <CheckCircle2 size={48} style={{ margin: '0 auto 16px auto', color: 'hsl(var(--accent-emerald))', opacity: 0.8 }} />
          <h3>All caught up!</h3>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>You have no pending loan or udhaar transactions with outstanding payments due.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Overdue Section */}
          {overdueReminders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', color: 'hsl(var(--accent-rose))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--accent-rose))' }}></span>
                Critical Action Required (Overdue)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overdueReminders.map(tx => renderReminderCard(tx))}
              </div>
            </div>
          )}

          {/* Today Section */}
          {todayReminders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', color: 'hsl(var(--accent-amber))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--accent-amber))' }}></span>
                Due Today
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayReminders.map(tx => renderReminderCard(tx))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {upcomingReminders.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', color: 'hsl(var(--accent-indigo))', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--accent-indigo))' }}></span>
                Upcoming Settlements
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingReminders.map(tx => renderReminderCard(tx))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Repay modal fallback, copy pasted from transactions */}
      {repayTransaction && (
        <div style={{
          position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>Log Repayment / Settlement</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Recording a payment against <strong>{repayTransaction.description || repayTransaction.category}</strong>.
            </p>
            
            <form onSubmit={handleRepaySubmit}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Total Amount:</span>
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

  function renderReminderCard(tx) {
    const outstanding = tx.amount - tx.repaid_amount;
    const urgency = getUrgencyState(tx.due_date);
    const isLoanGiven = tx.type === 'loan_given' || tx.type === 'udhar_given';

    return (
      <div key={tx.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Info Left */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: isLoanGiven ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
            color: isLoanGiven ? 'hsl(var(--accent-violet))' : 'hsl(var(--accent-indigo))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                {tx.description || tx.category}
              </h4>
              {getUrgencyBadge(urgency)}
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              {tx.person && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} /> Contact: {tx.person}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Due: <strong style={{ color: urgency === 'overdue' ? 'hsl(var(--accent-rose))' : '#fff' }}>{tx.due_date}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Info Right & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Outstanding Balance</div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'hsl(var(--accent-rose))', marginTop: '2px' }}>
              ₹{outstanding.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              of ₹{tx.amount.toLocaleString('en-IN')} total
            </div>
          </div>
          
          <button
            onClick={() => setRepayTransaction(tx)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            Settle Bill <ChevronRight size={14} />
          </button>
        </div>

      </div>
    );
  }
};
