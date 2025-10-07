
import React from 'react';

export default function SyncProgressBar({ syncStatus }) {
  const isSynced = syncStatus.unsyncedCount === 0;
  const width = isSynced ? '100%' : '30%';
  const bgColor = isSynced ? '#4caf50' : '#f44336';
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: 3,
          width,
          backgroundColor: bgColor,
          transition: 'width 1s, background-color 1s',
        }}
      />
    </div>
  );
}
