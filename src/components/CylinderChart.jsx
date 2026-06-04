import React, { useEffect, useState } from 'react';

export const CylinderChart = ({ data = [] }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Small delay to trigger the height animation
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, [data]);

  // Find max value to scale the heights
  const maxVal = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="glass-card" style={{ flex: 1, minWidth: '320px' }}>
      <h3 style={{ marginBottom: '24px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1' }}></span>
        Financial Overview (3D Cylinder Analytics)
      </h3>
      
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '280px', paddingBottom: '20px' }}>
        {data.map((item, index) => {
          const percentage = ((item.value || 0) / maxVal) * 100;
          const heightVal = animate ? `${Math.max(percentage * 1.8, 15)}px` : '15px'; // min height 15px

          return (
            <div key={index} className="cylinder-wrapper" style={{ height: '240px' }}>
              {/* Display Value above */}
              <div style={{ fontSize: '14px', fontWeight: '8px', color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
                ₹{item.value.toLocaleString('en-IN')}
              </div>

              {/* 3D Cylinder Bar */}
              <div className="cylinder-3d" style={{ height: heightVal }}>
                {/* Top cap */}
                <div className={`cylinder-face cylinder-top gradient-${item.colorClass}-top`}></div>
                
                {/* Side body */}
                <div className={`cylinder-side gradient-${item.colorClass}`}></div>
                
                {/* Bottom cap */}
                <div className={`cylinder-face cylinder-bottom gradient-${item.colorClass}-bottom`}></div>
              </div>

              {/* Label below */}
              <div style={{ marginTop: '20px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
