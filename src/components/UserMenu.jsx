import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserMenu.css';

/**
 * UserMenu - Dropdown meni u header-u kada je korisnik ulogovan
 */
function UserMenu({ user, onChangePassword, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Zatvori meni kad se klikne van njega
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuItemClick = (action) => {
    console.log('handleMenuItemClick pozvan sa action:', action);
    setIsOpen(false);
    action();
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span className="user-name">{user.name}</span>
        <span className="user-tura">({user.username})</span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-info">
            <div className="user-detail">
              <strong>{user.name}</strong>
            </div>
            <div className="user-detail">
              Tura: {user.username}
            </div>
            <div className="user-detail">
              Uloga: {user.role === 'admin' ? 'Administrator' : 'Vozač'}
            </div>
          </div>

          <div className="menu-divider"></div>

          {user?.role === 'admin' && (
            <button 
              className="menu-item"
              onClick={() => handleMenuItemClick(() => navigate('/admin'))}
            >
              <span className="menu-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94a7.07,7.07,0,0,0,.05-.94,7.07,7.07,0,0,0-.05-.94l2.11-1.65a.5.5,0,0,0,.12-.64l-2-3.46a.5.5,0,0,0-.6-.22l-2.49,1a7.18,7.18,0,0,0-1.63-.94l-.38-2.65A.5.5,0,0,0,13.7,2H10.3a.5.5,0,0,0-.49.42L9.43,5.07a7.18,7.18,0,0,0-1.63.94l-2.49-1a.5.5,0,0,0-.6.22l-2,3.46a.5.5,0,0,0,.12.64L5,11.06a7.07,7.07,0,0,0-.05.94,7.07,7.07,0,0,0,.05.94L2.89,14.59a.5.5,0,0,0-.12.64l2,3.46a.5.5,0,0,0,.6.22l2.49-1a7.18,7.18,0,0,0,1.63.94l.38,2.65a.5.5,0,0,0,.49.42h3.4a.5.5,0,0,0,.49-.42l.38-2.65a7.18,7.18,0,0,0,1.63-.94l2.49,1a.5.5,0,0,0,.6-.22l2-3.46a.5.5,0,0,0-.12-.64ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
                </svg>
              </span>
              Admin panel
            </button>
          )}

          {user?.role !== 'admin' && (
            <button 
              className="menu-item"
              onClick={() => handleMenuItemClick(() => navigate('/payroll'))}
            >
              <span className="menu-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4V8H18C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H10V4C10 2.9 10.9 2 12 2M12 4V8H12V4M6 10V20H18V10H6M8 12H16V14H8V12M8 16H16V18H8V16Z"/>
                </svg>
              </span>
              Platna Lista
            </button>
          )}

          <div className="menu-divider"></div>

          <button 
            className="menu-item"
            onClick={() => handleMenuItemClick(onChangePassword)}
          >
            <span className="menu-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17a3 3 0 1 0-3-3h-1a4 4 0 1 1 7.9-1H20v6H8v-5h1a3 3 0 0 0 3 3z"/>
              </svg>
            </span>
            Promjena lozinke
          </button>

          <div className="menu-divider"></div>

          <button 
            className="menu-item logout"
            onClick={() => handleMenuItemClick(onLogout)}
          >
            <span className="menu-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17v-3h4v-4h-4V7l-5 5 5 5zm9-12h-8v2h8v10h-8v2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            Odjava
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;