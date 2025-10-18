import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Bell, Activity, CheckCircle, BarChart3 } from 'lucide-react';
import autoPushService from '../../services/AutoPushService';

/**
 * 📢 Custom Push Message Sender + Monitoring
 * Admin interface za slanje custom poruka i praćenje svih push notifikacija
 */
export default function CustomPushInterface({ currentTheme = 'default' }) {
  const [activeTab, setActiveTab] = useState('send');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('BD Evidencija');
  const [targetType, setTargetType] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  
  // Stats & monitoring
  const [pushStats, setPushStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [triggerStats, setTriggerStats] = useState(null);
  const [extraRides, setExtraRides] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const isNightTheme = currentTheme === 'night';

  // Load data
  useEffect(() => {
    if (activeTab !== 'send') {
      loadStatistics();
    }
  }, [activeTab]);

  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, subsRes, triggerRes, ridesRes] = await Promise.all([
        autoPushService.getPushStats(7),
        autoPushService.getActiveSubscriptions(),
        autoPushService.getTriggerStats(),
        autoPushService.getExtraRides('pending', 10)
      ]);

      if (statsRes.success) setPushStats(statsRes);
      if (subsRes.success) setSubscriptions(subsRes);
      if (triggerRes.success) setTriggerStats(triggerRes);
      if (ridesRes.success) setExtraRides(ridesRes.rides);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setResult({ success: false, error: 'Unesite poruku' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await autoPushService.sendCustomMessage({
        title: title.trim() || 'BD Evidencija',
        message: message.trim(),
        targetType
      });

      setResult(res);
      
      if (res.success) {
        setMessage('');
        setTimeout(() => setResult(null), 5000);
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setSending(false);
    }
  };

  const handleTestNotification = async (type) => {
    setSending(true);
    setResult(null);

    try {
      let res;
      switch (type) {
        case 'daily':
          res = await autoPushService.testDailyDataNotification();
          break;
        case 'payroll':
          res = await autoPushService.testPayrollNotification();
          break;
        case 'extra_ride':
          res = await autoPushService.testExtraRideNotification();
          break;
        default:
          throw new Error('Unknown test type');
      }

      setResult(res);
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setSending(false);
    }
  };

  const handleExtraRideAction = async (rideId, action) => {
    try {
      const res = await autoPushService.reviewExtraRide(
        rideId, 
        action, 
        'admin', 
        action === 'approved' ? 'Odobreno' : 'Odbijeno iz admin panela'
      );
      
      if (res.success) {
        // Refresh extra rides
        const ridesRes = await autoPushService.getExtraRides('pending', 10);
        if (ridesRes.success) setExtraRides(ridesRes.rides);
      }
    } catch (error) {
      console.error('Failed to review extra ride:', error);
    }
  };

  const tabs = [
    { id: 'send', label: 'Pošalji poruku', icon: Send },
    { id: 'stats', label: 'Statistike', icon: BarChart3 },
    { id: 'monitor', label: 'Monitoring', icon: Activity },
    { id: 'rides', label: 'Extra vožnje', icon: Users }
  ];

  const cardClass = `rounded-2xl border transition-all duration-200 ${
    isNightTheme 
      ? 'bg-gray-800/90 border-gray-700/50 text-white' 
      : 'bg-white border-gray-200 text-gray-900'
  }`;

  const buttonPrimary = `px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
    isNightTheme
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white'
  }`;

  const buttonSecondary = `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
    isNightTheme
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Push Notifikacije</h3>
            <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Pošaljite poruke vozačima ili pratite statistike
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isNightTheme
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardClass} p-4 border-l-4 ${
            result.success 
              ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {result.success 
                ? `✅ Poslano ${result.sent || 0} notifikacija` 
                : `❌ Greška: ${result.error}`}
            </span>
          </div>
        </motion.div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Custom Message */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold">Custom poruka</h4>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isNightTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Naslov
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="BD Evidencija"
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    isNightTheme
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isNightTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Poruka
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Unesite vašu poruku..."
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors resize-none ${
                    isNightTheme
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isNightTheme ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Pošalji kome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Svima', icon: Users },
                    { value: 'drivers', label: 'Vozačima', icon: UserCheck },
                    { value: 'admins', label: 'Adminima', icon: Crown }
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected = targetType === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTargetType(option.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : isNightTheme
                            ? 'border-gray-600 hover:border-gray-500'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                className={`w-full ${buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {sending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Šalje se...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pošalji poruku
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Notifications */}
          <div className={`${cardClass} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold">Test notifikacije</h4>
            </div>
            
            <div className="space-y-3">
              {[
                { type: 'daily', label: 'Dnevni podaci', desc: 'Test dnevnih statistika', emoji: '📊' },
                { type: 'payroll', label: 'Platna lista', desc: 'Test nove platne liste', emoji: '💰' },
                { type: 'extra_ride', label: 'Extra vožnja', desc: 'Test extra vožnje', emoji: '🚗' }
              ].map((test) => (
                <button
                  key={test.type}
                  onClick={() => handleTestNotification(test.type)}
                  disabled={sending}
                  className={`w-full ${buttonSecondary} text-left disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{test.emoji}</span>
                    <div>
                      <div className="font-medium">{test.label}</div>
                      <div className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        {test.desc}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingStats ? (
            <div className="col-span-full text-center py-8">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p>Učitavam statistike...</p>
            </div>
          ) : (
            <>
              {/* Push Stats */}
              {pushStats?.stats && Object.entries(pushStats.stats).map(([type, stats]) => (
                <div key={type} className={`${cardClass} p-6`}>
                  <h4 className="font-semibold mb-4 capitalize">{type.replace('_', ' ')}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Poslano</span>
                      <span className="font-medium text-green-600">{stats.sent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Neuspešno</span>
                      <span className="font-medium text-red-600">{stats.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ukupno</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Subscriptions */}
              {subscriptions && (
                <div className={`${cardClass} p-6`}>
                  <h4 className="font-semibold mb-4">Aktivne pretplate</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Vozači</span>
                      <span className="font-medium">{subscriptions.byType?.driver?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Admini</span>
                      <span className="font-medium">{subscriptions.byType?.admin?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Ukupno</span>
                      <span className="font-medium">{subscriptions.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'rides' && (
        <div className="space-y-4">
          <h4 className="font-semibold">Pending extra vožnje</h4>
          {extraRides.length === 0 ? (
            <div className={`${cardClass} p-8 text-center`}>
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className={isNightTheme ? 'text-gray-400' : 'text-gray-600'}>
                Nema pending extra vožnji
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {extraRides.map((ride) => (
                <div key={ride.id} className={`${cardClass} p-4`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{ride.driver_name}</h5>
                      <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                        {ride.ride_details?.destination} • {ride.ride_details?.time}
                      </p>
                      {ride.ride_details?.notes && (
                        <p className={`text-xs mt-1 ${isNightTheme ? 'text-gray-500' : 'text-gray-500'}`}>
                          {ride.ride_details.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExtraRideAction(ride.id, 'approved')}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                      >
                        ✅ Odobri
                      </button>
                      <button
                        onClick={() => handleExtraRideAction(ride.id, 'rejected')}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        ❌ Odbij
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}