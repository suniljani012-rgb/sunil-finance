import React, { useState } from 'react';

export const PieChart = ({ data = [], title = "Distribution" }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // SVG parameters
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const center = 60; // center coordinate

  let accumulatedPercent = 0;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '320px' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
        {title}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '30px', flex: 1 }}>
        {/* SVG Donut Chart */}
        {total === 0 ? (
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '2px dashed var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No Data
          </div>
        ) : (
          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              {data.map((item, index) => {
                if (item.value <= 0) return null;
                const percent = item.value / total;
                const strokeLength = percent * circumference;
                const strokeOffset = circumference - strokeLength + (accumulatedPercent * circumference);
                
                accumulatedPercent -= percent;

                // Glowing color representation
                const colorMap = {
                  emerald: '#10b981',
                  rose: '#f43f5e',
                  indigo: '#6366f1',
                  amber: '#f59e0b',
                  violet: '#8b5cf6'
                };
                const color = colorMap[item.colorClass] || '#6b7280';
                const isHovered = hoveredIndex === index;

                return (
                  <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    style={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      filter: isHovered ? `drop-shadow(0 0 4px ${color})` : 'none',
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>
            {/* Center label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>₹{total.toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}

        {/* Chart Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '150px' }}>
          {data.map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const colorMap = {
              emerald: '#10b981',
              rose: '#f43f5e',
              indigo: '#6366f1',
              amber: '#f59e0b',
              violet: '#8b5cf6'
            };
            const color = colorMap[item.colorClass] || '#6b7280';
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                  transition: 'background 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: isHovered ? `0 0 8px ${color}` : 'none',
                  display: 'inline-block'
                }}></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: isHovered ? '#fff' : 'var(--text-secondary)' }}>{item.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.value.toLocaleString('en-IN')} ({pct}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
