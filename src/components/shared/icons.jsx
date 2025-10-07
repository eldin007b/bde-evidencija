import React from 'react';

export const ChartBarIcon = ({ className = '', title = 'Statistika' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="7" y="12" width="2.5" height="6" rx="0.5" fill="currentColor" />
    <rect x="11.25" y="8" width="2.5" height="10" rx="0.5" fill="currentColor" />
    <rect x="15.5" y="4" width="2.5" height="14" rx="0.5" fill="currentColor" />
  </svg>
);

export const UsersIcon = ({ className = '', title = 'Vozači' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <path d="M17 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TruckIcon = ({ className = '', title = 'Sonderfahrt' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor" />
    <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor" />
  </svg>
);

export const InfoIcon = ({ className = '', title = 'O Aplikaciji' }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <title>{title}</title>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M11 12h1v4h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default null;
