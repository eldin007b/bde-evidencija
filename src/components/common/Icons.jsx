import React from 'react';

export function IconCalendar({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4V2C7 1.44772 7.44772 1 8 1S9 1.44772 9 2V4H15V2C15 1.44772 15.4477 1 16 1S17 1.44772 17 2V4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4H7Z" fill="url(#cal-gradient)"/>
      <path d="M3 10H21V8H3V10Z" fill="#fff" fillOpacity="0.3"/>
      <circle cx="8" cy="13" r="1" fill="#fff"/>
      <circle cx="12" cy="13" r="1" fill="#fff"/>
      <circle cx="16" cy="13" r="1" fill="#fff"/>
      <circle cx="8" cy="17" r="1" fill="#fff"/>
      <circle cx="12" cy="17" r="1" fill="#fff"/>
      <defs>
        <linearGradient id="cal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea"/>
          <stop offset="100%" stopColor="#764ba2"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconDriver({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="url(#driver-gradient)"/>
      <path d="M5 18C5 15.7909 6.79086 14 9 14H15C17.2091 14 19 15.7909 19 18V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V18Z" fill="url(#driver-gradient)"/>
      <ellipse cx="12" cy="8" rx="2" ry="2.5" fill="#fff" fillOpacity="0.3"/>
      <rect x="10" y="16" width="4" height="2" rx="1" fill="#fff" fillOpacity="0.4"/>
      <defs>
        <linearGradient id="driver-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconRest({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10Z" fill="url(#rest-gradient)"/>
      <ellipse cx="12" cy="12" rx="6" ry="2" fill="#fff" fillOpacity="0.3"/>
      <path d="M8 14C8 13.4477 8.44772 13 9 13H15C15.5523 13 16 13.4477 16 14V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V14Z" fill="#fff" fillOpacity="0.6"/>
      <circle cx="10" cy="15" r="0.5" fill="url(#rest-gradient)"/>
      <circle cx="12" cy="15" r="0.5" fill="url(#rest-gradient)"/>
      <circle cx="14" cy="15" r="0.5" fill="url(#rest-gradient)"/>
      <defs>
        <linearGradient id="rest-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconStats({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 14C5 13.4477 5.44772 13 6 13H8C8.55228 13 9 13.4477 9 14V20C9 20.5523 8.55228 21 8 21H6C5.44772 21 5 20.5523 5 20V14Z" fill="url(#stats-gradient1)"/>
      <path d="M10.5 10C10.5 9.44772 10.9477 9 11.5 9H13.5C14.0523 9 14.5 9.44772 14.5 10V20C14.5 20.5523 14.0523 21 13.5 21H11.5C10.9477 21 10.5 20.5523 10.5 20V10Z" fill="url(#stats-gradient2)"/>
      <path d="M16 6C16 5.44772 16.4477 5 17 5H19C19.5523 5 20 5.44772 20 6V20C20 20.5523 19.5523 21 19 21H17C16.4477 21 16 20.5523 16 20V6Z" fill="url(#stats-gradient3)"/>
      <circle cx="7" cy="16" r="1" fill="#fff" fillOpacity="0.4"/>
      <circle cx="12.5" cy="13" r="1" fill="#fff" fillOpacity="0.4"/>
      <circle cx="18" cy="10" r="1" fill="#fff" fillOpacity="0.4"/>
      <defs>
        <linearGradient id="stats-gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
        <linearGradient id="stats-gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </linearGradient>
        <linearGradient id="stats-gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconRefresh({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12C4 7.58172 7.58172 4 12 4C14.1217 4 16.1566 4.84285 17.6569 6.34315L20 4V10H14L16.2426 7.75736C15.3284 6.84315 14.1716 6.25 13 6C9.68629 6 7 8.68629 7 12C7 15.3137 9.68629 18 13 18C15.7614 18 18 15.7614 18 13H20C20 16.866 16.866 20 13 20C8.58172 20 5 16.4183 5 12Z" fill="url(#refresh-gradient)"/>
      <defs>
        <linearGradient id="refresh-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconTrend({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17L9 11L13 15L21 7" stroke="url(#trend-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 7H21V14" stroke="url(#trend-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="11" r="2" fill="url(#trend-gradient)" fillOpacity="0.3"/>
      <circle cx="13" cy="15" r="2" fill="url(#trend-gradient)" fillOpacity="0.3"/>
      <defs>
        <linearGradient id="trend-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconPackage({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#package-gradient)"/>
      <path d="M2 17L12 22L22 17" stroke="url(#package-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12L12 17L22 12" stroke="url(#package-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V22" stroke="#fff" strokeWidth="1" strokeOpacity="0.5"/>
      <circle cx="12" cy="7" r="1" fill="#fff" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="package-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconCar({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 11L6.5 6.5C6.78 5.61 7.61 5 8.54 5H15.46C16.39 5 17.22 5.61 17.5 6.5L19 11" stroke="url(#car-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 11H21C21.55 11 22 11.45 22 12V16C22 17.1 21.1 18 20 18H19" stroke="url(#car-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 18H4C2.9 18 2 17.1 2 16V12C2 11.45 2.45 11 3 11" stroke="url(#car-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="18" r="2" fill="url(#car-gradient)"/>
      <circle cx="17" cy="18" r="2" fill="url(#car-gradient)"/>
      <rect x="8" y="7" width="8" height="2" rx="1" fill="#fff" fillOpacity="0.6"/>
      <circle cx="7" cy="18" r="1" fill="#fff" fillOpacity="0.8"/>
      <circle cx="17" cy="18" r="1" fill="#fff" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="car-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9C27B0"/>
          <stop offset="100%" stopColor="#673AB7"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconUser({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="3" fill="url(#user-gradient)"/>
      <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="url(#user-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="7" r="1.5" fill="#fff" fillOpacity="0.6"/>
      <path d="M10 17H14C15.1 17 16 17.9 16 19V20H8V19C8 17.9 8.9 17 10 17Z" fill="#fff" fillOpacity="0.3"/>
      <defs>
        <linearGradient id="user-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3"/>
          <stop offset="100%" stopColor="#1976D2"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconLocation({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C15.31 2 18 4.69 18 8C18 13.25 12 22 12 22S6 13.25 6 8C6 4.69 8.69 2 12 2Z" fill="url(#location-gradient)"/>
      <circle cx="12" cy="8" r="2.5" fill="#fff" fillOpacity="0.9"/>
      <circle cx="12" cy="8" r="1" fill="url(#location-gradient)"/>
      <defs>
        <linearGradient id="location-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E91E63"/>
          <stop offset="100%" stopColor="#C2185B"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconNumber({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="12" rx="2" fill="url(#number-gradient)"/>
      <rect x="5" y="8" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="9" y="8" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="13" y="8" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="17" y="8" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="5" y="12" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="9" y="12" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="13" y="12" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <rect x="17" y="12" width="2" height="2" rx="1" fill="#fff" fillOpacity="0.9"/>
      <defs>
        <linearGradient id="number-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconRoute({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 4C10.1046 4 11 4.89543 11 6C11 7.10457 10.1046 8 9 8C7.89543 8 7 7.10457 7 6C7 4.89543 7.89543 4 9 4Z" fill="url(#route-gradient)"/>
      <path d="M15 16C16.1046 16 17 16.8954 17 18C17 19.1046 16.1046 20 15 20C13.8954 20 13 19.1046 13 18C13 16.8954 13.8954 16 15 16Z" fill="url(#route-gradient)"/>
      <path d="M9 8L9 10C9 11.1046 9.89543 12 11 12L13 12C14.1046 12 15 12.8954 15 14L15 16" stroke="url(#route-gradient)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="6" r="1.5" fill="#fff" fillOpacity="0.8"/>
      <circle cx="15" cy="18" r="1.5" fill="#fff" fillOpacity="0.8"/>
      <defs>
        <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#388E3C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconMoney({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="url(#money-gradient)"/>
      <path d="M12 6V8M12 16V18M16 12H18M6 12H8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12Z" stroke="#fff" strokeWidth="1.5"/>
      <text x="12" y="13" textAnchor="middle" dy="0.3em" fontSize="6" fill="#fff" fontWeight="bold">€</text>
      <defs>
        <linearGradient id="money-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconPending({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="url(#pending-gradient)"/>
      <path d="M12 7V12L16 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="#fff"/>
      <defs>
        <linearGradient id="pending-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconApproved({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="url(#approved-gradient)"/>
      <path d="M9 12L11 14L15 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="0.5" opacity="0.3"/>
      <defs>
        <linearGradient id="approved-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconTotal({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" fill="url(#total-gradient)"/>
      <path d="M7 8H17M7 12H17M7 16H13" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="6" r="3" fill="#4CAF50"/>
      <text x="18" y="7" textAnchor="middle" dy="0.3em" fontSize="8" fill="#fff" fontWeight="bold">€</text>
      <defs>
        <linearGradient id="total-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9C27B0"/>
          <stop offset="100%" stopColor="#673AB7"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Sidebar ikone
export function IconToday({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="14" rx="3" fill="url(#today-gradient)"/>
      <rect x="7" y="2" width="2" height="6" rx="1" fill="url(#today-gradient)"/>
      <rect x="15" y="2" width="2" height="6" rx="1" fill="url(#today-gradient)"/>
      <rect x="3" y="10" width="18" height="2" fill="#fff" fillOpacity="0.3"/>
      <circle cx="12" cy="15" r="3" fill="#fff" fillOpacity="0.9"/>
      <path d="M10.5 15L11.5 16L13.5 14" stroke="url(#today-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="today-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2196F3"/>
          <stop offset="100%" stopColor="#1565C0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconMonth({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="14" rx="3" fill="url(#month-gradient)"/>
      <rect x="7" y="2" width="2" height="6" rx="1" fill="url(#month-gradient)"/>
      <rect x="15" y="2" width="2" height="6" rx="1" fill="url(#month-gradient)"/>
      <rect x="3" y="10" width="18" height="2" fill="#fff" fillOpacity="0.3"/>
      
      {/* Mini kalendar grid */}
      <circle cx="8" cy="14" r="1" fill="#fff" fillOpacity="0.7"/>
      <circle cx="12" cy="14" r="1" fill="#fff" fillOpacity="0.7"/>
      <circle cx="16" cy="14" r="1" fill="#fff" fillOpacity="0.7"/>
      <circle cx="8" cy="17" r="1" fill="#fff" fillOpacity="0.7"/>
      <circle cx="12" cy="17" r="1" fill="#fff" fillOpacity="0.9"/>
      <circle cx="16" cy="17" r="1" fill="#fff" fillOpacity="0.7"/>
      
      <defs>
        <linearGradient id="month-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF9800"/>
          <stop offset="100%" stopColor="#F57C00"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconYear({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="6" width="18" height="14" rx="3" fill="url(#year-gradient)"/>
      <rect x="7" y="2" width="2" height="6" rx="1" fill="url(#year-gradient)"/>
      <rect x="15" y="2" width="2" height="6" rx="1" fill="url(#year-gradient)"/>
      <rect x="3" y="10" width="18" height="2" fill="#fff" fillOpacity="0.3"/>
      
      {/* Trophy icon za godinu */}
      <path d="M12 12C13.1046 12 14 12.8954 14 14V16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16V14C10 12.8954 10.8954 12 12 12Z" fill="#fff" fillOpacity="0.9"/>
      <path d="M9 14H15" stroke="#fff" strokeWidth="1" strokeOpacity="0.7"/>
      <circle cx="12" cy="15" r="1" fill="url(#year-gradient)"/>
      
      <defs>
        <linearGradient id="year-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9C27B0"/>
          <stop offset="100%" stopColor="#6A1B9A"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconTruck({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="14" height="8" rx="2" fill="url(#truck-gradient)"/>
      <path d="M16 10H19L21 12V16H19" stroke="url(#truck-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="7" cy="18" r="2" fill="url(#truck-gradient)"/>
      <circle cx="17" cy="18" r="2" fill="url(#truck-gradient)"/>
      <rect x="4" y="10" width="8" height="4" rx="1" fill="#fff" fillOpacity="0.3"/>
      <rect x="5" y="11" width="2" height="2" rx="0.5" fill="#fff" fillOpacity="0.7"/>
      <defs>
        <linearGradient id="truck-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconTarget({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="url(#target-gradient)"/>
      <circle cx="12" cy="12" r="6" fill="#fff" fillOpacity="0.3"/>
      <circle cx="12" cy="12" r="3" fill="#fff" fillOpacity="0.6"/>
      <circle cx="12" cy="12" r="1" fill="url(#target-gradient)"/>
      <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7"/>
      <defs>
        <linearGradient id="target-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5722"/>
          <stop offset="100%" stopColor="#D32F2F"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconDelivery({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="12" height="10" rx="2" fill="url(#delivery-gradient)"/>
      <path d="M14 12H18L20 14V18H18" stroke="url(#delivery-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="20" r="2" fill="url(#delivery-gradient)"/>
      <circle cx="16" cy="20" r="2" fill="url(#delivery-gradient)"/>
      <rect x="4" y="10" width="8" height="6" rx="1" fill="#fff" fillOpacity="0.3"/>
      <path d="M6 13L8 15L12 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="delivery-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconComplaint({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="url(#complaint-gradient)"/>
      <path d="M12 7V13" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1.5" fill="#fff"/>
      <path d="M8 4L12 8L16 4" fill="#fff" fillOpacity="0.7"/>
      <defs>
        <linearGradient id="complaint-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconSettings({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="url(#settings-gradient)"/>
      <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2578 9.77251 19.9887C9.5799 19.7197 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" fill="url(#settings-gradient)"/>
      <defs>
        <linearGradient id="settings-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#4338CA"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconChevronLeft({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconChevronRight({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBell({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C9.243 2 7 4.243 7 7V10.586C7 11.476 6.632 12.324 6 12.928L4.293 14.535C3.52 15.308 4.074 16.5 5.121 16.5H18.879C19.926 16.5 20.48 15.308 19.707 14.535L18 12.928C17.368 12.324 17 11.476 17 10.586V7C17 4.243 14.757 2 12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.554 21.597 13.064 22 12.5 22C11.936 22 11.446 21.597 11.27 21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
