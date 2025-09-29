import React from 'react';
// import { FaTachometerAlt, FaSync, FaUsers, FaTabletAlt, FaCar } from 'react-icons/fa';
import DashboardTab from './admin/DashboardTab';
import SyncTab from './admin/SyncTab';
import DriversTab from './admin/DriversTab';
import RidesTab from './admin/RidesTab';
import ExtraRidesApprovalTab from './admin/ExtraRidesApprovalTab';
import CloseButton from '../components/common/CloseButton.jsx';
import './AdminPanelScreen.css';

// Web verzija tab navigacije
const TABS = [
  { name: 'Dashboard', icon: '📊', component: DashboardTab },
  { name: 'Sinhronizacija', icon: '🔄', component: SyncTab },
  { name: 'Vozači', icon: '🧑‍💼', component: DriversTab },
  { name: 'Vožnje', icon: '🚗', component: RidesTab },
  { name: 'Ekstra vožnje', icon: '🛻', component: ExtraRidesApprovalTab },
];

export default function AdminPanelScreen() {
  const [activeTab, setActiveTab] = React.useState(0);
  const ActiveComponent = TABS[activeTab].component;

  return (
    <div className="admin-panel-container">
      <CloseButton style={{ margin: '20px' }} />
      <div className="admin-tab-bar">
        {TABS.map((tab, idx) => (
          <button
            key={tab.name}
            className={activeTab === idx ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setActiveTab(idx)}
          >
            <span className="admin-tab-icon">{tab.icon}</span>
            <span className="admin-tab-label">{tab.name}</span>
          </button>
        ))}
      </div>
      <div className="admin-tab-content">
        <ActiveComponent />
      </div>
    </div>
  );
}
