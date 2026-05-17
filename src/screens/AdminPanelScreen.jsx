import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Truck,
  Settings,
  Github,
  ArrowLeft,
  Crown,
  Activity,
  FileText,
  Palmtree,
  Clock
} from 'lucide-react';

import useDrivers from '../hooks/useDrivers';
import useSimpleAuth from '../hooks/useSimpleAuth';
import { useDashboardData } from '../hooks/useDashboardData';

import RidesTab from '../components/admin/RidesTab';
import DriversTab from '../components/admin/DriversTab';
import SystemTab from '../components/admin/SystemTab';
import GitHubTab from '../components/admin/GitHubTab';
import InvoicesTab from '../components/admin/InvoicesTab';
import UrlaubTab from '../components/admin/UrlaubTab';
import WorktimeTab from '../components/admin/WorktimeTab';

import DashboardOverview from '../components/admin/DashboardOverview';
import PayrollAnalytics from '../components/admin/PayrollAnalytics';
import ChangePasswordModal from '../components/ChangePasswordModal';
import UserMenu from '../components/UserMenu';

const TABS_CONFIG = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    component: 'dashboard',
    description: 'Pregled sistema u realnom vremenu',
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    id: 'users',
    label: 'Vozači',
    icon: Users,
    component: DriversTab,
    description: 'Upravljanje vozačima i korisnicima',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    id: 'urlaub',
    label: 'Urlaub',
    icon: Palmtree,
    component: UrlaubTab,
    description: 'Godišnji odmori i austrijski praznici',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'worktime',
    label: 'Evidencija rada',
    icon: Clock,
    component: WorktimeTab,
    description: 'Radno vrijeme, Urlaub i Ladezeit po vozaču',
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'rides',
    label: 'Vožnje',
    icon: Truck,
    component: RidesTab,
    description: 'Extra vožnje i odobravanja',
    gradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'invoices',
    label: 'Računi',
    icon: FileText,
    component: InvoicesTab,
    description: 'GLS Rechnung Generator',
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'settings',
    label: 'Sistem',
    icon: Settings,
    component: SystemTab,
    description: 'Sistemske postavke i konfiguracija',
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    id: 'github',
    label: 'GitHub',
    icon: Github,
    component: GitHubTab,
    description: 'GitHub integracija i verzije',
    gradient: 'from-gray-600 to-gray-800'
  }
];

export default function AdminPanelScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('night');

  const navigate = useNavigate();
  const { currentUser: user, logout, changePassword } = useSimpleAuth();
  const driversHook = useDrivers();
  const { drivers } = driversHook;
  const { stats: dashboardData, loading, error, refetch } = useDashboardData(drivers);

  const themes = {
    night: {
      background: 'from-slate-900 via-blue-900 to-indigo-900',
      accent: 'from-blue-400 to-purple-400'
    }
  };

  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  const isNightTheme = currentTheme === 'night';

  const renderTabContent = () => {
    const activeTabConfig = TABS_CONFIG.find(tab => tab.id === activeTab);

    if (activeTab === 'dashboard') {
      return (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <DashboardOverview
            data={dashboardData}
            drivers={drivers}
            loading={loading}
            error={error}
            onRefresh={refetch}
          />
          <PayrollAnalytics drivers={drivers} currentTheme={currentTheme} />
        </motion.div>
      );
    }

    if (activeTabConfig?.component && typeof activeTabConfig.component !== 'string') {
      const Component = activeTabConfig.component;

      return (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Component driversHook={driversHook} drivers={drivers} currentTheme={currentTheme} />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="not-implemented"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className={`text-center ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Tab "{activeTab}" nije implementiran</p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themes[currentTheme].background}`}>
      <div className="relative z-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`sticky top-0 z-50 backdrop-blur-xl ${
            isNightTheme ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
          } border-b`}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => navigate(-1)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-xl ${
                    isNightTheme
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-white text-gray-800 hover:bg-gray-50'
                  } shadow-lg`}
                >
                  <ArrowLeft className="w-6 h-6" />
                </motion.button>

                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`p-3 rounded-xl bg-gradient-to-r ${themes[currentTheme].accent}`}
                  >
                    <Crown className="w-6 h-6 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-sm text-gray-400">Upravljanje sistemom</p>
                  </div>
                </div>
              </div>

              <UserMenu
                user={user}
                onChangePassword={() => setIsChangePasswordOpen(true)}
                onLogout={logout}
                currentTheme={currentTheme}
                themes={themes}
              />
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {TABS_CONFIG.map(({ id, label, icon: Icon, description, gradient }) => {
                const isActive = activeTab === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-4 py-3 rounded-xl flex items-center gap-2 font-medium transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                    title={description}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="whitespace-nowrap">{label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-xl border-2 border-white/30"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait">{renderTabContent()}</AnimatePresence>
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChangePassword={changePassword}
        loading={false}
      />
    </div>
  );
}
