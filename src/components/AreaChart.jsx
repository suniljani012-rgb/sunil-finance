import React, { useState } from 'react';

export const AreaChart = ({ transactions = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // 1. Sort transactions by date and calculate cumulative running balance
  const sortedTx = [...transactions]
    .sort((a, b) => a.created_at - b.created_at);

  let currentBalance = 0;
  const balancePoints = sortedTx.map(tx => {
    const amt = tx.amount;
    if (tx.type === 'income' || tx.type === 'loan_taken' || tx.type === 'udhar_taken') {
      currentBalance += amt;
    } else {
      currentBalance -= amt;
    }
    return {
      date: new Date(tx.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      balance: currentBalance,
      rawDate: tx.created_at,
      description: tx.description || tx.category
    };
  });

  // Fallback if no transactions
  if (balancePoints.length === 0) {
    return (
      <div className="glass-card" style={{ flex: 2, minWidth: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '330px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Log transactions to see balance trends.</div>
      </div>
    );
  }

  // 2. Set chart view boundaries
  const width = 600;
  const height = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find min and max values to scale coordinates
  const balances = balancePoints.map(p => p.balance);
  const maxVal = Math.max(...balances, 1);
  const minVal = Math.min(...balances, 0);
  const valRange = maxVal - minVal || 1;

  // Map points to SVG coordinates
  const svgPoints = balancePoints.map((p, idx) => {
    const x = paddingLeft + (idx / (balancePoints.length - 1 || 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((p.balance - minVal) / valRange) * chartHeight;
    return { x, y, ...p };
  });

  // Create path strings
  let linePath = '';
  let areaPath = '';

  if (svgPoints.length > 0) {
    linePath = `M ${svgPoints[0].x} ${svgPoints[0].y} ` + svgPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${svgPoints[svgPoints.length - 1].x} ${height - paddingBottom} L ${svgPoints[0].x} ${height - paddingBottom} Z`;
  }

  return (
    <div className="glass-card" style={{ flex: 2, minWidth: '320px', position: 'relative' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0a84ff' }}></span>
        Liquidity Flow & Net Balance Trend
      </h3>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            {/* Area fill gradient */}
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a84ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0a84ff" stopOpacity="0.00" />
            </linearGradient>
            {/* Stroke glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * chartHeight;
            const val = maxVal - ratio * valRange;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="10" textAnchor="end">
                  ₹{Math.round(val).toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* Filled Area */}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

          {/* Glowing Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#0a84ff"
              strokeWidth="2.5"
              filter="url(#glow)"
              style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
            />
          )}

          {/* Interactive Dots */}
          {svgPoints.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint && hoveredPoint.idx === idx ? 6 : 4}
              fill="#0a84ff"
              stroke="#fff"
              strokeWidth="1.5"
              style={{ cursor: 'pointer', transition: 'r 0.1s' }}
              onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}

          {/* X Axis Labels */}
          {svgPoints.length > 1 && [0, Math.floor(svgPoints.length / 2), svgPoints.length - 1].map((pIdx) => {
            const pt = svgPoints[pIdx];
            if (!pt) return null;
            return (
              <text key={pIdx} x={pt.x} y={height - 8} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">
                {pt.date}
              </text>
            );
          })}
        </svg>

        {/* Hover Tooltip Card overlay */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            left: `${hoveredPoint.x - 20}px`,
            top: `${hoveredPoint.y - 65}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(22, 22, 26, 0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            borderRadius: '6px',
            padding: '6px 10px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{hoveredPoint.date} • {hoveredPoint.description}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: hoveredPoint.balance >= 0 ? '#30d158' : '#ff453a', marginTop: '2px' }}>
              ₹{hoveredPoint.balance.toLocaleString('en-IN')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
