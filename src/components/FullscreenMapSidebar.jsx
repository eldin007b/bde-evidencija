import React, { useState } from 'react';
import MapCardModern from './components/shared/MapCardModern.jsx';
import SidebarModern from './components/shared/SidebarModern.jsx';

const FullscreenMapSidebar = () => {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <>
      {!showSidebar && <MapCardModern />}
      {showSidebar && <SidebarModern className="open" />}
      <button
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 30,
          padding: '12px 20px', borderRadius: 8, background: 'var(--primary-500)', color: '#fff', border: 'none', fontSize: 18
        }}
        onClick={() => setShowSidebar(!showSidebar)}
      >
        {showSidebar ? 'Zatvori izbornik' : 'Otvori izbornik'}
      </button>
    </>
  );
};

export default FullscreenMapSidebar;
