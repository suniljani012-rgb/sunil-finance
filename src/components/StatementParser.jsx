import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Upload, FileSpreadsheet, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export const StatementParser = () => {
  const { fetch } = useAuth();
  
  // Data lists from DB
  const [accounts, setAccounts] = useState([]);
  const [payees, setPayees] = useState([]);
  const [headers, setHeaders] = useState([]);

  // States
  const [targetAccount, setTargetAccount] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [fileHeaders, setFileHeaders] = useState([]);
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

  // Fetch db configuration lists
  const loadConfiguration = async () => {
    try {
      const accData = await fetch('/api/accounts');
      setAccounts(accData.accounts);
      if (accData.accounts.length > 0) {
        setTargetAccount(accData.accounts[0].id);
      }
      
      const payeeData = await fetch('/api/payees');
      setPayees(payeeData.payees);

      const headData = await fetch('/api/headers');
      setHeaders(headData.headers);
    } catch (err) {
      console.error("Failed to load configs:", err);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

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

        const cols = parsed[0];
        setFileHeaders(cols);
        setCsvData(parsed.slice(1));
        setFileSelected(true);

        // Auto-detect columns
        const newMapping = { date: -1, desc: -1, amount: -1, debit: -1, credit: -1 };
        cols.forEach((h, idx) => {
          const lower = h.toLowerCase();
          if (lower.includes('date') || lower.includes('dt')) newMapping.date = idx;
          else if (lower.includes('desc') || lower.includes('particular') || lower.includes('narrat') || lower.includes('remark')) newMapping.desc = idx;
          else if (lower.includes('amount') || lower.includes('val')) newMapping.amount = idx;
          else if (lower.includes('debit') || lower.includes('withdrawal') || lower.includes('dr')) newMapping.debit = idx;
          else if (lower.includes('credit') || lower.includes('deposit') || lower.includes('cr')) newMapping.credit = idx;
        });

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
      let categoryId = '';
      let personId = '';

      if (currentMapping.date !== -1 && row[currentMapping.date]) {
        date = formatParsedDate(row[currentMapping.date]);
      } else {
        date = new Date().toISOString().split('T')[0];
      }

      if (currentMapping.desc !== -1 && row[currentMapping.desc]) {
        desc = row[currentMapping.desc];
      }

      if (currentMapping.debit !== -1 && row[currentMapping.debit] && Number(row[currentMapping.debit].replace(/[^0-9.]/g, '')) > 0) {
        amount = Number(row[currentMapping.debit].replace(/[^0-9.]/g, ''));
        type = 'expense';
      } else if (currentMapping.credit !== -1 && row[currentMapping.credit] && Number(row[currentMapping.credit].replace(/[^0-9.]/g, '')) > 0) {
        amount = Number(row[currentMapping.credit].replace(/[^0-9.]/g, ''));
        type = 'income';
      } else if (currentMapping.amount !== -1 && row[currentMapping.amount]) {
        const rawAmt = row[currentMapping.amount].replace(/[^0-9.-]/g, '');
        const val = Number(rawAmt);
        amount = Math.abs(val);
        type = val < 0 ? 'expense' : 'income';
      }

      // Narration key checks to auto category map
      const descLower = desc.toLowerCase();
      
      // Auto payee matching
      const matchedPayee = payees.find(p => descLower.includes(p.name.toLowerCase()));
      if (matchedPayee) {
        personId = matchedPayee.id;
      }

      // Auto Category header matching
      const targetType = type === 'income' ? 'income' : 'expense';
      const typeHeaders = headers.filter(h => h.type === targetType);
      
      const matchedHeader = typeHeaders.find(h => descLower.includes(h.name.toLowerCase()));
      if (matchedHeader) {
        categoryId = matchedHeader.id;
      } else if (typeHeaders.length > 0) {
        categoryId = typeHeaders[0].id; // Fallback to first available category of that type
      }

      return {
        id: rowIdx,
        date,
        description: desc,
        amount,
        type,
        category_id: categoryId,
        person_id: personId,
        selected: true
      };
    }).filter(tx => tx.amount > 0);

    setParsedRows(preview);
  };

  const formatParsedDate = (dateStr) => {
    try {
      const clean = dateStr.replace(/[^0-9/-]/g, '');
      const parts = clean.split(/[/-]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (parts[0].length === 4) {
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

  const handleCategoryChange = (id, val) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, category_id: val } : r));
  };

  const handlePayeeChange = (id, val) => {
    setParsedRows(prev => prev.map(r => r.id === id ? { ...r, person_id: val } : r));
  };

  const handleTypeChange = (id, val) => {
    setParsedRows(prev => {
      return prev.map(r => {
        if (r.id === id) {
          // Switch category selector options based on new type
          const related = headers.filter(h => h.type === (val === 'income' ? 'income' : 'expense'));
          return {
            ...r,
            type: val,
            category_id: related.length > 0 ? related[0].id : ''
          };
        }
        return r;
      });
    });
  };

  const handleBatchImport = async () => {
    const toImport = parsedRows.filter(r => r.selected);
    if (toImport.length === 0) {
      setErrorMsg('No transactions selected.');
      return;
    }
    if (!targetAccount) {
      setErrorMsg('Destination bank account is required.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setProgress({ current: 0, total: toImport.length });

    try {
      let count = 0;
      for (const row of toImport) {
        const catObj = headers.find(h => h.id === row.category_id);
        
        await fetch('/api/transactions', {
          method: 'POST',
          body: JSON.stringify({
            type: row.type,
            amount: row.amount,
            category_id: row.category_id || null,
            category: catObj ? catObj.name : 'Statement Import',
            description: row.description,
            person_id: row.person_id || null,
            account_id: targetAccount,
            status: 'paid',
            due_date: row.date
          })
        });
        count++;
        setProgress({ current: count, total: toImport.length });
      }

      setSuccessMsg(`Imported ${count} statement lines successfully!`);
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
        <h2 style={{ fontSize: '28px', fontWeight: '800' }}>Bank Statement CSV Parser</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Upload statement sheet to batch synchronize transactions with bank accounts and payee files.</p>
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

      {/* Progress */}
      {uploading && (
        <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'rgb(var(--apple-blue))' }} />
          <h4>Importing ledger entries...</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 12px 0' }}>Processed {progress.current} of {progress.total} rows</p>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(progress.current / progress.total) * 100}%`, background: 'rgb(var(--apple-blue))', transition: 'width 0.15s' }}></div>
          </div>
        </div>
      )}

      {!fileSelected && !uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Target account selector */}
          <div className="glass-card" style={{ maxWidth: '400px' }}>
            <div className="input-group">
              <label className="input-label">Statement Bank Account</label>
              <select className="input-field" value={targetAccount} onChange={e => setTargetAccount(e.target.value)}>
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (Balance: ₹{acc.balance.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>
          </div>

          <label className="dropzone animate-scale-in" style={{ display: 'block' }}>
            <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.08)', color: 'rgb(var(--apple-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} />
              </div>
              <div>
                <h3>Upload Bank Statement CSV</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>Supports standard credit card or checking statements.</p>
              </div>
            </div>
          </label>
        </div>
      ) : (
        !uploading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Mappings */}
            <div className="glass-card animate-scale-in">
              <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Configure CSV Column Mapping</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Date Column</label>
                  <select className="input-field" value={mapping.date} onChange={e => handleMappingChange('date', e.target.value)}>
                    <option value="-1">Select Column</option>
                    {fileHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Narration / Particulars</label>
                  <select className="input-field" value={mapping.desc} onChange={e => handleMappingChange('desc', e.target.value)}>
                    <option value="-1">Select Column</option>
                    {fileHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Single Amount Column</label>
                  <select className="input-field" value={mapping.amount} onChange={e => handleMappingChange('amount', e.target.value)}>
                    <option value="-1">None (Use Debit/Credit)</option>
                    {fileHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Debit / Withdrawal</label>
                  <select className="input-field" value={mapping.debit} onChange={e => handleMappingChange('debit', e.target.value)}>
                    <option value="-1">None (Use Single Amount)</option>
                    {fileHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Credit / Deposit</label>
                  <select className="input-field" value={mapping.credit} onChange={e => handleMappingChange('credit', e.target.value)}>
                    <option value="-1">None (Use Single Amount)</option>
                    {fileHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3>Statement Entries Preview ({parsedRows.filter(r => r.selected).length} selected)</h3>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleBatchImport} className="btn btn-primary">
                    Import to {accounts.find(a => a.id === targetAccount)?.name}
                  </button>
                  <button onClick={() => setFileSelected(false)} className="btn btn-secondary">
                    Reset
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 16px', width: '40px' }}></th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Date</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Narration</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Category Head</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Payee Contact</th>
                      <th style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map(row => {
                      const relatedHeaders = headers.filter(h => h.type === (row.type === 'income' ? 'income' : 'expense'));

                      return (
                        <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', opacity: row.selected ? 1 : 0.4 }} className="table-row-hover">
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <input type="checkbox" checked={row.selected} onChange={() => handleRowToggle(row.id)} style={{ cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {row.date}
                          </td>
                          <td style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.description}
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <select className="input-field" value={row.type} onChange={e => handleTypeChange(row.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px' }}>
                              <option value="expense">Debit (Outflow)</option>
                              <option value="income">Credit (Inflow)</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <select className="input-field" value={row.category_id} onChange={e => handleCategoryChange(row.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: '160px' }}>
                              <option value="">Select Category</option>
                              {relatedHeaders.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <select className="input-field" value={row.person_id} onChange={e => handlePayeeChange(row.id, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: '140px' }}>
                              <option value="">None</option>
                              {payees.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '8px 16px', fontWeight: 'bold', fontSize: '14px', color: row.type === 'income' ? 'rgb(var(--apple-green))' : '#fff' }}>
                            ₹{row.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
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
