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
