import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  User,
  ChevronDown,
  LogOut,
  KeyRound,
  LayoutDashboard,
  Wallet,
  Crown,
  Activity,
  Clock,
  Truck,
  Bell,
  BellOff,
  Bug,
} from "lucide-react";
import pushRegistrationService from '../services/PushRegistrationService';
import { runCompleteDiagnostic } from '../utils/debugPushNotifications';
import { testDirectPushNotification, testBrowserNotificationAPI } from '../utils/testPushNotifications';
import visualDebug from '../utils/visualDebugger';

export default function UserMenu({ user, onChangePassword, onLogout, scraperData, currentTheme = 'default', themes }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Default themes if not provided
  const defaultThemes = {
    default: { accent: 'from-blue-600 to-purple-600', gradient: 'bg-gradient-to-r from-blue-500 to-purple-500' },
    sunrise: { accent: 'from-orange-500 to-pink-500', gradient: 'bg-gradient-to-r from-orange-400 to-pink-400' },
    afternoon: { accent: 'from-blue-500 to-cyan-500', gradient: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
    evening: { accent: 'from-purple-600 to-indigo-600', gradient: 'bg-gradient-to-r from-purple-500 to-indigo-500' },
    night: { accent: 'from-gray-600 to-blue-800', gradient: 'bg-gradient-to-r from-gray-500 to-blue-700' }
  };
  const themeConfig = themes || defaultThemes;

  // Status scrappera
  const getScraperStatus = () => {
    if (!scraperData) return { text: "Nepoznato", color: "text-gray-500" };
    if (scraperData.status === "completed") return { text: "Uspešno", color: "text-emerald-500" };
    if (scraperData.status === "in_progress") return { text: "U toku", color: "text-amber-500" };
    if (scraperData.status === "failure") return { text: "Greška", color: "text-rose-500" };
    return { text: "Nepoznato", color: "text-gray-500" };
  };

  const formatScraperTime = () => {
    if (!scraperData) return "Nepoznato";
    const candidates = [
      scraperData.formattedTimestamp,
      scraperData.timestamp,
      scraperData.raw?.updated_at,
      scraperData.raw?.run_started_at,
      scraperData.raw?.created_at,
    ];
    for (const c of candidates) {
      if (c) {
        const d = new Date(c);
        if (!isNaN(d.getTime())) {
          return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} ${String(
            d.getHours()
          ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
      }
    }
    return "Nepoznato";
  };

  // 🔔 Check notifications status on component mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (pushRegistrationService.isSupported()) {
        const isRegistered = await pushRegistrationService.checkRegistrationStatus(user?.id || 'admin');
        setNotificationsEnabled(isRegistered);
      }
    };
    checkNotificationStatus();
  }, [user]);

  // 🔔 Toggle push notifications
  const toggleNotifications = async () => {
    console.log('🔔 toggleNotifications called, current state:', { notificationsEnabled, notificationsLoading });
    setNotificationsLoading(true);
    try {
      if (notificationsEnabled) {
        // Disable notifications - can't really "unregister" but can indicate disabled state
        setNotificationsEnabled(false);
        console.log('🔕 Notifications disabled');
      } else {
        // Enable notifications
        console.log('🔄 Calling pushRegistrationService with user:', { id: user?.id, role: user?.role });
        const result = await pushRegistrationService.requestPermissionAndRegister(user?.id || 'admin', user?.role || 'user');
        console.log('📊 Registration result:', result);
        if (result.success) {
          setNotificationsEnabled(true);
          console.log('🔔 Notifications enabled successfully');
        } else {
          console.error('❌ Failed to enable notifications:', result.reason, result.error);
          // Show alert to user for debugging
          alert(`Greška: ${result.reason || 'Nepoznata greška'}`);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      // Show alert to user for debugging
      alert(`Greška u toggleNotifications: ${error.message}`);
    } finally {
      setNotificationsLoading(false);
      console.log('🏁 toggleNotifications finished');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside button, container, and dropdown
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target);
      const isOutsideContainer = menuRef.current && !menuRef.current.contains(e.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target);
      
      if (isOutsideButton && isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleClick = () => setIsOpen(!isOpen);
  const handleMenuItemClick = (fn) => {
    setIsOpen(false);
    setTimeout(() => fn?.(), 100);
  };

  return (
    <div 
      className="relative inline-block text-left" 
      ref={menuRef}
      style={{ 
        zIndex: isOpen ? 999999 : 'auto',
        position: 'relative'
      }}
    >
      {/* Enhanced Avatar button */}
      <motion.div 
        ref={buttonRef}
        onClick={handleClick} 
        whileHover={{ scale: 1.05, y: -2 }} 
        whileTap={{ scale: 0.95 }}
      >
        <motion.div 
          className={`flex items-center gap-3 px-3 py-2 ${currentTheme === 'night' ? 'bg-gray-800/40' : 'bg-white/60'} backdrop-blur-2xl rounded-full border ${currentTheme === 'night' ? 'border-white/10' : 'border-gray-100/50'} cursor-pointer transition-all duration-300`}
          style={{
            boxShadow: currentTheme === 'night'
              ? '6px 6px 12px rgba(0,0,0,0.4), -6px -6px 12px rgba(255,255,255,0.02)'
              : '6px 6px 12px rgba(0,0,0,0.08), -6px -6px 12px rgba(255,255,255,0.8)'
          }}
          whileHover={{
            boxShadow: currentTheme === 'night'
              ? '8px 8px 16px rgba(0,0,0,0.6), -8px -8px 16px rgba(255,255,255,0.05)'
              : '8px 8px 16px rgba(0,0,0,0.12), -8px -8px 16px rgba(255,255,255,0.9)'
          }}
        >
          <motion.div 
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${themeConfig[currentTheme].accent} flex items-center justify-center text-white font-bold`}
            whileHover={{ rotate: [0, 5, -5, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {user?.role === "admin" ? (
              <Crown className="w-6 h-6 text-amber-400" />
            ) : (
              <Truck className="w-6 h-6 text-white" />
            )}
          </motion.div>
          <span className={`font-medium ${currentTheme === 'night' ? 'text-gray-200' : 'text-gray-800'}`}>
            {user?.name || "Korisnik"}
          </span>
          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className={`w-4 h-4 ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-500'}`} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Dropdown - Simple absolute positioning */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`absolute right-0 mt-2 w-72 ${currentTheme === 'night' ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-3xl border ${currentTheme === 'night' ? 'border-white/30' : 'border-gray-300'} rounded-2xl p-4`}
            style={{
              zIndex: 999999,
              position: 'absolute',
              top: '100%',
              right: 0,
              boxShadow: currentTheme === 'night'
                ? '0 25px 50px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.2)'
                : '0 25px 50px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.1)',
              transform: 'translateZ(0)',
              willChange: 'transform, opacity'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Compact Profile Section */}
            <div className="flex items-center gap-2 mb-3">
              <motion.div 
                className={`w-10 h-10 bg-gradient-to-br ${themeConfig[currentTheme].accent} rounded-full flex items-center justify-center text-white font-bold`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                style={{
                  boxShadow: currentTheme === 'night'
                    ? '3px 3px 6px rgba(0,0,0,0.6), -2px -2px 4px rgba(255,255,255,0.05)'
                    : '3px 3px 6px rgba(0,0,0,0.15), -2px -2px 4px rgba(255,255,255,0.8)'
                }}
              >
                {user?.role === "admin" ? (
                  <Crown className="w-6 h-6 text-amber-400" />
                ) : (
                  <Truck className="w-6 h-6 text-white" />
                )}
              </motion.div>
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${currentTheme === 'night' ? 'text-gray-100' : 'text-gray-900'}`}>
                  {user?.name || "Korisnik"}
                </h3>
                <p className={`text-xs ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.username || "korisnik"}
                </p>
              </div>
              {user?.role === "admin" && (
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                </motion.div>
              )}
            </div>

            {/* Compact Payment Data */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Prikaz plata samo za ne-admin korisnike */}
              {user?.role !== "admin" && (
                <>
                  {/* Zadnja plata */}
                  <motion.div 
                    className={`${currentTheme === 'night' 
                      ? 'bg-gray-800/50 border-gray-600/50' 
                      : 'bg-blue-50/80 border-blue-200/60'
                    } border rounded-xl p-2 transition-all hover:shadow-sm backdrop-blur-sm`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`text-xs font-medium ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'} mb-1`}>
                      Zadnja plata
                    </div>
                    <div className={`font-bold ${currentTheme === 'night' ? 'text-blue-300' : 'text-blue-900'} text-sm`}>
                      {user?.zadnjaPlata || "-"}
                    </div>
                  </motion.div>
                  {/* Ukupna zarada */}
                  <motion.div 
                    className={`${currentTheme === 'night' 
                      ? 'bg-gray-800/50 border-gray-600/50' 
                      : 'bg-emerald-50/80 border-emerald-200/60'
                    } border rounded-xl p-2 transition-all hover:shadow-sm backdrop-blur-sm`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`text-xs font-medium ${currentTheme === 'night' ? 'text-emerald-400' : 'text-emerald-600'} mb-1`}>
                      Ukupna zarada
                    </div>
                    <div className={`font-bold ${currentTheme === 'night' ? 'text-emerald-300' : 'text-emerald-900'} text-sm`}>
                      {user?.ukupnaZarada || "-"}
                    </div>
                  </motion.div>
                </>
              )}
            </div>

            {/* Compact Scraper status - samo admin */}
            {user?.role === "admin" && scraperData && (
              <motion.div 
                className={`${currentTheme === 'night' 
                  ? 'bg-gray-800/50 border-gray-600/50' 
                  : 'bg-blue-50/80 border-blue-200/60'
                } border rounded-xl p-2 mb-3 backdrop-blur-sm`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-600'} flex items-center gap-1`}>
                    <Activity className={`w-3 h-3 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-500'}`} />
                    Status:
                  </span>
                  <span className={`font-medium ${getScraperStatus().color}`}>{getScraperStatus().text}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className={`${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-1`}>
                    <Clock className={`w-3 h-3`} />
                    Vrijeme:
                  </span>
                  <span className={`${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'} font-mono`}>{formatScraperTime()}</span>
                </div>
              </motion.div>
            )}

            {/* Compact Action Buttons */}
            <div className="space-y-1">
              {user?.role === "admin" ? (
                <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-left ${currentTheme === 'night' 
                      ? 'hover:bg-gray-700/50 text-blue-400' 
                      : 'hover:bg-blue-50 text-blue-600'
                    } rounded-xl transition-all duration-300 py-2 text-sm`}
                    onClick={() => handleMenuItemClick(() => navigate("/admin"))}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-left ${currentTheme === 'night' 
                      ? 'hover:bg-gray-700/50 text-emerald-400' 
                      : 'hover:bg-green-50 text-emerald-600'
                    } rounded-xl transition-all duration-300 py-2 text-sm`}
                    onClick={() => handleMenuItemClick(() => navigate("/payroll-list"))}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Platne liste
                  </Button>
                </motion.div>
              )}
              
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start text-left ${currentTheme === 'night' 
                    ? 'hover:bg-gray-700/50 text-amber-400' 
                    : 'hover:bg-amber-50 text-amber-600'
                  } rounded-xl transition-all duration-300 py-2 text-sm`}
                  onClick={() => {
                    if (typeof onChangePassword === 'function') {
                      onChangePassword();
                    }
                  }}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Promijeni šifru
                </Button>
              </motion.div>
              
              {/* 🔔 Push Notifications Toggle */}
              {pushRegistrationService.isSupported() && (
                <>
                  <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={notificationsLoading}
                      className={`w-full justify-start text-left ${currentTheme === 'night' 
                        ? `hover:bg-gray-700/50 ${notificationsEnabled ? 'text-green-400' : 'text-gray-400'}` 
                        : `hover:bg-blue-50 ${notificationsEnabled ? 'text-green-600' : 'text-gray-600'}`
                      } rounded-xl transition-all duration-300 py-2 text-sm`}
                      onClick={() => handleMenuItemClick(toggleNotifications)}
                    >
                      {notificationsLoading ? (
                        <div className="w-4 h-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      ) : notificationsEnabled ? (
                        <Bell className="w-4 h-4 mr-2" />
                      ) : (
                        <BellOff className="w-4 h-4 mr-2" />
                      )}
                      {notificationsLoading ? 'Učitava...' : notificationsEnabled ? 'Obavještenja uključena' : 'Uključi obavještenja'}
                    </Button>
                  </motion.div>
                  
                  {/* 🧪 Test Notification Buttons */}
                  {notificationsEnabled && (
                    <>
                      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className={`w-full justify-start text-left ${currentTheme === 'night' 
                            ? 'hover:bg-gray-700/50 text-purple-400' 
                            : 'hover:bg-purple-50 text-purple-600'
                          } rounded-xl transition-all duration-300 py-2 text-sm`}
                          onClick={async () => {
                            handleMenuItemClick(async () => {
                              console.log('🧪 Testing Supabase push notification...');
                              const result = await pushRegistrationService.sendTestNotification();
                              if (result) {
                                console.log('✅ Supabase test notification sent successfully');
                              } else {
                                console.error('❌ Supabase test notification failed');
                              }
                            });
                          }}
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Test Supabase
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="ghost"
                          size="sm" 
                          className={`w-full justify-start text-left ${currentTheme === 'night' 
                            ? 'hover:bg-gray-700/50 text-green-400' 
                            : 'hover:bg-green-50 text-green-600'
                          } rounded-xl transition-all duration-300 py-2 text-sm`}
                          onClick={() => {
                            handleMenuItemClick(async () => {
                              console.log('🧪 Testing direct push notification...');
                              const result = await testDirectPushNotification();
                              if (result) {
                                console.log('✅ Direct push notification sent successfully');
                              } else {
                                console.error('❌ Direct push notification failed');
                              }
                            });
                          }}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          Test direktno
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-left ${currentTheme === 'night' 
                            ? 'hover:bg-gray-700/50 text-blue-400' 
                            : 'hover:bg-blue-50 text-blue-600'
                          } rounded-xl transition-all duration-300 py-2 text-sm`}
                          onClick={() => {
                            handleMenuItemClick(async () => {
                              console.log('🧪 Testing browser notification API...');
                              const result = await testBrowserNotificationAPI();
                              if (result) {
                                console.log('✅ Browser API notification sent successfully');
                              } else {
                                console.error('❌ Browser API notification failed');
                              }
                            });
                          }}
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Test Browser API
                        </Button>
                      </motion.div>
                    </>
                  )}
                  
                  {/* 🐛 Debug Push Notifications */}
                  {user?.role === 'admin' && (
                    <>
                      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="ghost"
                          size="sm" 
                          className={`w-full justify-start text-left ${currentTheme === 'night' 
                            ? 'hover:bg-gray-700/50 text-orange-400' 
                            : 'hover:bg-orange-50 text-orange-600'
                          } rounded-xl transition-all duration-300 py-2 text-sm`}
                          onClick={() => {
                            handleMenuItemClick(async () => {
                              visualDebug.log('🐛 Running push notifications diagnostic...');
                              await runCompleteDiagnostic();
                            });
                          }}
                        >
                          <Bug className="w-4 h-4 mr-2" />
                          Debug obavještenja
                        </Button>
                      </motion.div>
                      
                      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-left ${currentTheme === 'night' 
                            ? 'hover:bg-gray-700/50 text-yellow-400' 
                            : 'hover:bg-yellow-50 text-yellow-600'
                          } rounded-xl transition-all duration-300 py-2 text-sm`}
                          onClick={() => {
                            handleMenuItemClick(async () => {
                              await visualDebug.testAllMethods();
                              setTimeout(() => {
                                visualDebug.showDebugPanel();
                              }, 1000);
                            });
                          }}
                        >
                          <Activity className="w-4 h-4 mr-2" />
                          Visual Test
                        </Button>
                      </motion.div>
                    </>
                  )}
                </>
              )}
              
              <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start text-left ${currentTheme === 'night' 
                    ? 'hover:bg-gray-700/50 text-rose-400' 
                    : 'hover:bg-rose-50 text-rose-600'
                  } rounded-xl transition-all duration-300 py-2 text-sm`}
                  onClick={() => handleMenuItemClick(onLogout)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Odjava
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
