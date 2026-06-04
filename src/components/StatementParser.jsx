import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle, HelpCircle, Loader2, ArrowRight } from 'lucide-react';

export const StatementParser = () => {
  const { fetch } = useAuth();
  
  // States
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileSelected, setFileSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Column mappings
  const [mapping, setMapping] = useState({
    date: -1,
    desc: -1,
    amount: -1,
    debit: -1,
    credit: -1
  });

  const [parsedRows, setParsedRows] = useState([]);

  // CSV parsing logic that handles commas inside quotes
  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    return lines.map(line => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = parseCSVText(text);

        if (parsed.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row.');
        }

        const fileHeaders = parsed[0];
        setHeaders(fileHeaders);
        setCsvData(parsed.slice(1));
        setFileSelected(true);

        // Auto-detect columns
        const newMapping = { date: -1, desc: -1, amount: -1, debit: -1, credit: -1 };
        fileHeaders.forEach((header, idx) => {
          const lower = header.toLowerCase();
          if (lower.includes('date') || lower.includes('dt')) newMapping.date = idx;
          else if (lower.includes('desc') || lower.includes('particular') || lower.includes('narrat') || lower.includes('remark')) newMapping.desc = idx;
          else if (lower.includes('amount') || lower.includes('val')) newMapping.amount = idx;
          else if (lower.includes('debit') || lower.includes('withdrawal') || lower.includes('dr')) newMapping.debit = idx;
          else if (lower.includes('credit') || lower.includes('deposit') || lower.includes('cr')) newMapping.credit = idx;
        });

        // Ensure we fall back if single amount is not found but debit/credit are
        setMapping(newMapping);
        generatePreview(parsed.slice(1), newMapping);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field, index) => {
    const updated = { ...mapping, [field]: Number(index) };
    setMapping(updated);
    generatePreview(csvData, updated);
  };

  const generatePreview = (rows, currentMapping) => {
    const preview = rows.map((row, rowIdx) => {
      let date = '';
      let desc = 'Bank Transaction';
      let amount = 0;
      let type = 'expense';
      let category = 'Uncategorized';

      if (currentMapping.date !== -1 && row[currentMapping.date]) {
        // Try parsing dates cleanly
        const rawDate = row[currentMapping.date];
        date = formatParsedDate(rawDate);
      } else {
        date = new Date().toISOString().split('T')[0];
      }

      if (currentMapping.desc !== -1 && row[currentMapping.desc]) {
        desc = row[currentMapping.desc];
      }

      // Check if we have explicit debit/credit columns
      if (currentMapping.debit !== -1 && row[currentMapping.debit] && Number(row[currentMapping.debit].replace(/[^0-9.]/g, '')) > 0) {
        amount = Number(row[currentMapping.debit].replace(/[^0-9.]/g, ''));
        type = 'expense';
        category = 'Bank Withdrawal';
      } else if (currentMapping.credit !== -1 && row[currentMapping.credit] && Number(row[currentMapping.credit].replace(/[^0-9.]/g, '')) > 0) {
        amount = Number(row[currentMapping.credit].replace(/[^0-9.]/g, ''));
        type = 'income';
        category = 'Bank Deposit';
      } else if (currentMapping.amount !== -1 && row[currentMapping.amount]) {
        const rawAmt = row[currentMapping.amount].replace(/[^0-9.-]/g, '');
        const val = Number(rawAmt);
        amount = Math.abs(val);
        // If the bank statement amount is negative, classify as expense, else income
        type = val < 0 ? 'expense' : 'income';
        category = val < 0 ? 'Bank Debit' : 'Bank Credit';
      }

      // Attempt to auto-categorize based on narration keywords
      const descLower = desc.toLowerCase();
      if (descLower.includes('salary') || descLower.includes('payroll')) {
        category = 'Salary';
        type = 'income';
      } else if (descLower.includes('upi') || descLower.includes('paytm') || descLower.includes('gpay')) {
        category = 'UPI Payment';
      } else if (descLower.includes('rent') || descLower.includes('lease')) {
        category = 'Rent';
        type = 'expense';
      } else if (descLower.includes('food') || descLower.includes('restaur') || descLower.includes('swiggy') || descLower.includes('zomato')) {
        category = 'Food & Dining';
        type = 'expense';
      } else if (descLower.includes('cash w') || descLower.includes('atm')) {
        category = 'ATM Cash';
        type = 'expense';
      }

      return {
        id: rowIdx,
        date,
        description: desc,
        amount,
        type,
        category,
        selected: true
      };
    }).filter(tx => tx.amount > 0); // Ignore empty or zero entries

    setParsedRows(preview);
  };

  const formatParsedDate = (dateStr) => {
    try {
      // Reformat DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
      const clean = dateStr.replace(/[^0-9/-]/g, '');
      const parts = clean.split(/[/-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD-MM-YYYY -> YYYY-MM-DD
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parts[0].length === 4) {
          // YYYY-MM-DD
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleRowToggle = (id) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleCategoryChange = (id, catVal) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, category: catVal } : r));
  };

  const handleTypeChange = (id, typeVal) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, type: typeVal } : r));
  };

  const handleBatchImport = async () => {
    const toImport = parsedRows.filter(r => r.selected);
    if (toImport.length === 0) {
      setErrorMsg('No transactions selected for import.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setProgress({ current: 0, total: toImport.length });

    try {
      let count = 0;
      for (const row of toImport) {
        await fetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            type: row.type,
            amount: row.amount,
            category: row.category,
            description: row.description,
            status: 'paid', // Statement entries are historical/settled
            due_date: row.date // Store date
          })
        });
        count++;
        setProgress({ current: count, total: toImport.length });
      }

      setSuccessMsg(`Successfully imported ${count} bank transactions into FinAura ledger!`);
      setFileSelected(false);
      setParsedRows([]);
      setCsvData([]);
    } catch (err) {
      setErrorMsg(`Import interrupted: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Bank Statement Uploader</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Upload your bank statement CSV file to batch import transactions instantly.</p>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(255, 69, 58, 0.1)', color: 'rgb(var(--apple-red))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(48, 209, 88, 0.1)', color: 'rgb(var(--apple-green))', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' }}>
          {successMsg}
        </div>
      )}

      {/* Progress tracker uploader */}
      {uploading && (
        <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'rgb(var(--apple-blue))' }} />
          <h4>Importing Statement Records...</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 12px 0' }}>Processing {progress.current} of {progress.total} entries</p>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(progress.current / progress.total) * 100}%`, background: 'rgb(var(--apple-blue))', transition: 'width 0.1s' }}></div>
          </div>
        </div>
      )}

      {!fileSelected && !uploading ? (
        /* Upload Area Dropzone */
        <label className="dropzone animate-scale-in" style={{ display: 'block' }}>
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.08)', color: 'rgb(var(--apple-blue))', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              {loading ? <Loader2 className="animate-spin" size={28} /> : <Upload size={28} />}
            </div>
            <div>
              <h3>{loading ? 'Reading statement details...' : 'Select Bank Statement CSV'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>Supports standard statement exports. Auto-detects Date, Particulars, and Amounts.</p>
            </div>
          </div>
        </label>
      ) : (
        /* Column Mapping & Preview Panel */
        !uploading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Mappings selection */}
            <div className="glass-card animate-scale-in">
              <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={16} /> Column Mapping Configuration
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {/* Date */}
                <div className="input-group">
                  <label className="input-label">Date Column</label>
                  <select className="input-field" value={mapping.date} onChange={(e) => handleMappingChange('date', e.target.value)}>
                    <option value="-1">Select Column</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                {/* Narration */}
                <div className="input-group">
                  <label className="input-label">Narration / Particulars</label>
                  <select className="input-field" value={mapping.desc} onChange={(e) => handleMappingChange('desc', e.target.value)}>
                    <option value="-1">Select Column</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                {/* Single Amount */}
                <div className="input-group">
                  <label className="input-label">Single Amount Column</label>
                  <select className="input-field" value={mapping.amount} onChange={(e) => handleMappingChange('amount', e.target.value)}>
                    <option value="-1">None (Using Debit/Credit)</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                {/* Debit */}
                <div className="input-group">
                  <label className="input-label">Debit / Withdrawal</label>
                  <select className="input-field" value={mapping.debit} onChange={(e) => handleMappingChange('debit', e.target.value)}>
                    <option value="-1">None (Using Single Amount)</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                {/* Credit */}
                <div className="input-group">
                  <label className="input-label">Credit / Deposit</label>
                  <select className="input-field" value={mapping.credit} onChange={(e) => handleMappingChange('credit', e.target.value)}>
                    <option value="-1">None (Using Single Amount)</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions Preview Ledger list */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3>Statement Entries Preview ({parsedRows.filter(r => r.selected).length} selected to import)</h3>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleBatchImport} className="btn btn-primary">
                    Confirm & Batch Import <ArrowRight size={14} />
                  </button>
                  <button onClick={() => setFileSelected(false)} className="btn btn-secondary">
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px', width: '40px' }}></th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Description Narration</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Category Tag</th>
                      <th style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: row.selected ? 1 : 0.4 }} className="table-row-hover">
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <input type="checkbox" checked={row.selected} onChange={() => handleRowToggle(row.id)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {row.date}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '500', color: '#fff', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.description}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <select className="input-field" value={row.type} onChange={(e) => handleTypeChange(row.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                            <option value="expense">Debit (Outflow)</option>
                            <option value="income">Credit (Inflow)</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={row.category}
                            onChange={(e) => handleCategoryChange(row.id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }}
                          />
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 'bold', fontSize: '14px', color: row.type === 'income' ? 'rgb(var(--apple-green))' : '#fff' }}>
                          ₹{row.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
