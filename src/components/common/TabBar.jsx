import React from 'react';

const TabBar = ({ tabs, activeTab, onChange }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 18, justifyContent: 'center' }}>
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        style={{
          background: activeTab === tab.key ? '#1769aa' : '#eee',
          color: activeTab === tab.key ? '#fff' : '#333',
          borderRadius: 8,
          padding: '10px 18px',
          fontWeight: 'bold',
          border: 'none',
          boxShadow: activeTab === tab.key ? '0 2px 8px rgba(23,105,170,0.10)' : 'none',
          cursor: 'pointer'
        }}
      >
        {tab.icon && <span style={{ marginRight: 6 }}>{tab.icon}</span>}
        {tab.label}
      </button>
    ))}
  </div>
);

export default TabBar;
