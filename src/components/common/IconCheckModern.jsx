import React from 'react';

export function IconCheckModern({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#check-green)" />
      <path d="M8 12.5L11 15.5L16 9.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="check-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconXModern({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#x-red)" />
      <path d="M8 8L16 16M16 8L8 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="x-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconArrowUpModern({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#arrow-green)" />
      <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="arrow-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconArrowDownModern({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#arrow-red)" />
      <path d="M12 8V16M12 16L8 12M12 16L16 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="arrow-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
    </svg>
  );
}
