import React from 'react';

// Single item shimmer components
export const SkeletonBox = ({ width = '100%', height = '20px', style = {} }) => (
  <div 
    className="skeleton-box shimmer" 
    style={{ width, height, ...style }} 
  />
);

export const SkeletonCircle = ({ size = '40px', style = {} }) => (
  <div 
    className="skeleton-circle shimmer" 
    style={{ width: size, height: size, flexShrink: 0, ...style }} 
  />
);

// High-fidelity Dashboard Shimmer
export const SkeletonDashboard = () => {
  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <SkeletonBox width="200px" height="28px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="350px" height="14px" />
        </div>
        <SkeletonBox width="120px" height="36px" style={{ borderRadius: '12px' }} />
      </div>

      {/* Stats Cards Grid Skeleton */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SkeletonBox width="60%" height="12px" />
              <SkeletonCircle size="28px" />
            </div>
            <SkeletonBox width="75%" height="24px" />
            <SkeletonBox width="50%" height="11px" />
          </div>
        ))}
      </div>

      {/* Area Chart Card Skeleton */}
      <div className="skeleton-card" style={{ height: '300px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SkeletonBox width="180px" height="18px" />
          <SkeletonBox width="140px" height="14px" />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
          {[...Array(12)].map((_, idx) => (
            <div key={idx} style={{ flex: 1, height: `${20 + Math.random() * 60}%`, background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="shimmer" />
          ))}
        </div>
      </div>

      {/* Grid with Cylinder & Pie Chart Skeletons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
        {/* Cylinder chart card */}
        <div className="skeleton-card" style={{ flex: '1 1 300px', height: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonBox width="150px" height="18px" />
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '220px', padding: '0 20px' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: `${40 + i * 10}px`, borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }} className="shimmer" />
                <SkeletonBox width="40px" height="12px" />
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart Card */}
        <div className="skeleton-card" style={{ flex: '1 1 300px', height: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SkeletonBox width="150px" height="18px" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '24px' }}>
            <SkeletonCircle size="140px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SkeletonCircle size="12px" />
                  <SkeletonBox width="70%" height="12px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// High-fidelity Table Shimmer (for transactions/ledger)
export const SkeletonTable = ({ columnsCount = 6, rowsCount = 6 }) => {
  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      {/* Top filter row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <SkeletonBox width="120px" height="36px" style={{ borderRadius: '8px' }} />
          <SkeletonBox width="150px" height="36px" style={{ borderRadius: '8px' }} />
        </div>
        <SkeletonBox width="140px" height="36px" style={{ borderRadius: '8px' }} />
      </div>

      {/* Table Card */}
      <div className="skeleton-card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'flex', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.01)' }}>
          {[...Array(columnsCount)].map((_, i) => (
            <div key={i} style={{ flex: 1, padding: '0 8px' }}>
              <SkeletonBox width="60%" height="12px" />
            </div>
          ))}
        </div>

        {/* Table Rows */}
        {[...Array(rowsCount)].map((_, r) => (
          <div 
            key={r} 
            style={{ 
              display: 'flex', 
              padding: '18px 20px', 
              borderBottom: r === rowsCount - 1 ? 'none' : '1px solid var(--border-color)',
              alignItems: 'center'
            }}
          >
            {[...Array(columnsCount)].map((_, c) => (
              <div key={c} style={{ flex: 1, padding: '0 8px' }}>
                {c === 0 ? (
                  <SkeletonBox width="45%" height="14px" />
                ) : c === 1 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <SkeletonCircle size="8px" />
                    <SkeletonBox width="65%" height="14px" />
                  </div>
                ) : (
                  <SkeletonBox width="70%" height="14px" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Generic list card shimmer
export const SkeletonList = ({ itemsCount = 4 }) => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {[...Array(itemsCount)].map((_, i) => (
        <div key={i} className="skeleton-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <SkeletonCircle size="36px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <SkeletonBox width="40%" height="15px" />
              <SkeletonBox width="25%" height="11px" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <SkeletonBox width="60px" height="15px" />
            <SkeletonBox width="40px" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
};
