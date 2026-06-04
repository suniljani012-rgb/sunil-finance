import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Filter, FileSpreadsheet, Printer, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const Reports = () => {
  const { fetch } = useAuth();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter conditions
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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

  // Extract unique categories for filter select options
  const categories = ['all', ...new Set(transactions.map(t => t.category).filter(Boolean))];

  // Apply filters in client memory for instant <0.01ms updates
  const filteredTx = transactions.filter(tx => {
    // 1. Date Range
    if (startDate) {
      const txDate = new Date(tx.due_date || tx.created_at);
      const start = new Date(startDate);
      if (txDate < start) return false;
    }
    if (endDate) {
      const txDate = new Date(tx.due_date || tx.created_at);
      const end = new Date(endDate);
      // set to end of day
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }

    // 2. Category
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
      return false;
    }

    // 3. Type
    if (typeFilter !== 'all') {
      if (typeFilter === 'inflow') {
        return tx.type === 'income' || tx.type === 'loan_taken' || tx.type === 'udhar_taken';
      } else if (typeFilter === 'outflow') {
        return tx.type === 'expense' || tx.type === 'loan_given' || tx.type === 'udhar_given';
      } else if (typeFilter === 'loans') {
        return tx.type.startsWith('loan_');
      } else if (typeFilter === 'udhar') {
        return tx.type.startsWith('udhar_');
      }
    }

    return true;
  });

  // Calculate filtered stats
  let totalInflow = 0;
  let totalOutflow = 0;

  filteredTx.forEach(tx => {
    const isInflow = tx.type === 'income' || tx.type === 'loan_taken' || tx.type === 'udhar_taken';
    if (isInflow) {
      totalInflow += tx.amount;
    } else {
      totalOutflow += tx.amount;
    }
  });

  const netFlow = totalInflow - totalOutflow;

  const handleExportCSV = () => {
    if (filteredTx.length === 0) return;

    // Build CSV content
    const headers = ['Date', 'Description', 'Type', 'Category', 'Person', 'Status', 'Amount (INR)'];
    const rows = filteredTx.map(tx => [
      tx.due_date || new Date(tx.created_at).toISOString().split('T')[0],
      tx.description || tx.category,
      tx.type.toUpperCase(),
      tx.category,
      tx.person || '',
      tx.status.toUpperCase(),
      tx.amount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinAura_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in print-area">
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }} className="no-print">
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Financial Reports</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Analyze, export, and print structured ledger breakdowns.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} disabled={filteredTx.length === 0} className="btn btn-secondary">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button onClick={handlePrint} disabled={filteredTx.length === 0} className="btn btn-primary">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Filters Form Panel */}
      <div className="glass-card no-print" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} /> Advanced Filtering Options
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {/* Start Date */}
          <div className="input-group">
            <label className="input-label">Start Date</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          {/* End Date */}
          <div className="input-group">
            <label className="input-label">End Date</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          {/* Cash Flow type */}
          <div className="input-group">
            <label className="input-label">Flow / Category Head</label>
            <select className="input-field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All Flow Types</option>
              <option value="inflow">Inflows (Income / Borrowed)</option>
              <option value="outflow">Outflows (Expense / Lent)</option>
              <option value="loans">Loans Only</option>
              <option value="udhar">Udhaar Only</option>
            </select>
          </div>
          {/* Category Filter */}
          <div className="input-group">
            <label className="input-label">Category Tag</label>
            <select className="input-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.slice(1).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Balance Statement Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="only-print" style={{ display: 'none', marginBottom: '24px' }}>
          <h1 style={{ color: '#000', fontSize: '24px', fontWeight: '800' }}>FinAura Statement Ledger</h1>
          <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Generated Statement Report: {startDate || 'Beginning'} to {endDate || 'Present'}</p>
        </div>

        <h3 style={{ marginBottom: '20px', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance Sheet Statement</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={14} style={{ color: 'rgb(var(--apple-green))' }} /> Filtered Inflow
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'rgb(var(--apple-green))', marginTop: '4px' }}>
              ₹{totalInflow.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownLeft size={14} style={{ color: 'rgb(var(--apple-red))' }} /> Filtered Outflow
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: 'rgb(var(--apple-red))', marginTop: '4px' }}>
              ₹{totalOutflow.toLocaleString('en-IN')}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Net Cash Flow</div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: netFlow >= 0 ? '#fff' : 'rgb(var(--apple-red))', marginTop: '4px' }}>
              ₹{netFlow.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Data Ledger Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading ledger statement...</div>
      ) : filteredTx.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No ledger entries found matching active filters.
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Description</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Category</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Contact</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map(tx => {
                const isInc = tx.type === 'income' || tx.type === 'loan_taken' || tx.type === 'udhar_taken';
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.due_date || new Date(tx.created_at).toISOString().split('T')[0]}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                      {tx.description || tx.category}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      <span style={{ color: isInc ? 'rgb(var(--apple-green))' : 'rgb(var(--apple-red))' }}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.category}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {tx.person || '-'}
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: '12px' }}>
                      {tx.status === 'paid' ? 'Settled' : 'Pending'}
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 'bold', fontSize: '14px', textAlign: 'right', color: isInc ? 'rgb(var(--apple-green))' : '#fff' }}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Print CSS styling overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .glass-card {
            background: none !important;
            border: 1px solid #ddd !important;
            color: #000 !important;
            box-shadow: none !important;
          }
          table {
            color: #000 !important;
          }
          tr {
            border-bottom: 1px solid #ddd !important;
          }
          th, td {
            color: #000 !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .only-print {
            display: block !important;
          }
          .main-layout {
            grid-template-columns: 1fr !important;
          }
          .content-area {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />
    </div>
  );
};
