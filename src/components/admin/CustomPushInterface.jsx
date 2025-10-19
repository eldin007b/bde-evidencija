import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Bell, Activity, CheckCircle, BarChart3, AlertCircle, Bug } from 'lucide-react';
import autoPushService from '../../services/AutoPushService';
import pushRegistrationService from '../../services/PushRegistrationService';
import visualDebug from '../../utils/visualDebugger';

/**
 * 📱 Simple Push Notifications Interface
 * Jednostavan interfejs za slanje push poruka vozačima
 */
export default function CustomPushInterface({ currentTheme = 'default' }) {
  const [activeTab, setActiveTab] = useState('send');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('BD Evidencija');
  const [targetType, setTargetType] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [pushStats, setPushStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  const isNightTheme = currentTheme === 'night';

  const openDebugger = () => {
    visualDebug.showDebugPanel();
    visualDebug.testAllMethods();
  };

  const testDirectNotifications = async () => {
    // Show visual debugger for production logging
    if (!visualDebug.isVisible) {
      visualDebug.showDebugPanel();
    }
    
    try {
      visualDebug.log('🧪 Starting direct notification test...', 'info');
      console.log('🧪 Testing direct notifications...');
      
      const result = await autoPushService.sendDirectNotifications({
        title: 'Test Direct',
        message: 'Ovo je test direktne notifikacije!',
        targetType: 'all'
      });
      
      visualDebug.log(`🧪 Test result: ${result.success ? 'SUCCESS' : 'FAILED'}`, result.success ? 'success' : 'error');
      console.log('🧪 Direct notification test result:', result);
      
      setResult({
        success: result.success,
        message: result.success ? 'Test direktne notifikacije uspešan!' : 'Test direktne notifikacije neuspešan!',
        details: result
      });
    } catch (error) {
      visualDebug.log(`🧪 Test ERROR: ${error.message}`, 'error');
      console.error('🧪 Direct notification test failed:', error);
      setResult({
        success: false,
        message: 'Greška pri testu direktnih notifikacija',
        details: error.message
      });
    }
  };

  const testServerPush = async () => {
    // IMMEDIATE FEEDBACK
    console.log('🚨 TEST SERVER PUSH BUTTON CLICKED!');
    alert('Test Server Push button clicked - check console!');
    
    // Check if function exists
    console.log('🔍 Checking autoPushService:', autoPushService);
    console.log('🔍 sendServerPushOnly function:', autoPushService.sendServerPushOnly);
    
    if (!autoPushService.sendServerPushOnly) {
      alert('ERROR: sendServerPushOnly function not found!');
      console.error('❌ sendServerPushOnly function not available');
      setResult({
        success: false,
        message: 'sendServerPushOnly funkcija nije dostupna',
        details: 'Function not exported or imported correctly'
      });
      return;
    }
    
    // FORCE visual debugger to open
    try {
      visualDebug.showDebugPanel();
      console.log('✅ Visual debugger opened');
      // Wait a bit for it to open
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.log('⚠️ Visual debugger not available:', e);
      alert('Visual debugger error: ' + e.message);
    }
    
    try {
      // Also show immediate notification for feedback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Server Push Test', { 
          body: 'Starting server push test...', 
          icon: '/bde-evidencija/icon-192x192.png' 
        });
      }
      
      console.log('🌐 STARTING SERVER PUSH TEST...');
      visualDebug.log('🌐 Starting server-side push test...', 'info');
      
      const result = await autoPushService.sendServerPushOnly({
        title: 'Server Push Test',
        message: 'Ovo je test server-side push notifikacije za sve uređaje!',
        targetType: 'all'
      });
      
      console.log('🌐 SERVER PUSH RESULT:', result);
      alert('Server push completed! Result: ' + JSON.stringify(result));
      visualDebug.log(`🌐 Server push result: ${result.success ? 'SUCCESS' : 'FAILED'}`, result.success ? 'success' : 'error');
      visualDebug.log(`📊 Sent: ${result.sent}, Failed: ${result.failed}, Method: ${result.method}`, 'info');
      
      // Show result notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Server Push Result', { 
          body: `${result.success ? 'SUCCESS' : 'FAILED'} - Sent: ${result.sent}`, 
          icon: '/bde-evidencija/icon-192x192.png' 
        });
      }
      
      setResult({
        success: result.success,
        message: result.success ? 'Server push test uspešan!' : 'Server push test neuspešan!',
        details: result
      });
    } catch (error) {
      console.error('🌐 SERVER PUSH ERROR:', error);
      alert('Server push error: ' + error.message);
      visualDebug.log(`🌐 Server push ERROR: ${error.message}`, 'error');
      setResult({
        success: false,
        message: 'Greška pri server push testu',
        details: error.message
      });
    }
  };

  // Check registration status and load stats
  useEffect(() => {
    checkRegistrationStatus();
    if (activeTab === 'stats') {
      loadStatistics();
    }
  }, [activeTab]);

  const checkRegistrationStatus = async () => {
    const registered = await pushRegistrationService.checkRegistrationStatus('admin');
    setIsRegistered(registered);
  };

  const registerForPushNotifications = async () => {
    setRegistering(true);
    try {
      const result = await pushRegistrationService.requestPermissionAndRegister('admin', 'admin');
      if (result.success) {
        setIsRegistered(true);
        setResult({
          success: true,
          message: 'Push notifikacije aktivirane! 🎉',
          details: 'Sada ćete dobijati notifikacije.'
        });
      } else {
        setResult({
          success: false,
          message: 'Greška pri aktivaciji push notifikacija',
          details: result.reason
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Greška pri registraciji',
        details: error.message
      });
    } finally {
      setRegistering(false);
    }
  };

  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const stats = await autoPushService.getSimpleStats();
      setPushStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const sendPushMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    setResult(null);
    
    try {
      const response = await autoPushService.sendCustomMessage({
        title: title || 'BD Evidencija',
        message: message.trim(),
        targetType: targetType
      });
      setResult({
        success: true,
        message: `Poruka uspješno poslana!`,
        details: response
      });
      setMessage('');
    } catch (error) {
      setResult({
        success: false,
        message: 'Greška pri slanju poruke',
        details: error.message
      });
    } finally {
      setSending(false);
    }
  };

  const quickMessages = [
    "Nova platna lista je dostupna! 💰",
    "Sistemi će biti u održavanju večeras od 22:00 🔧",
    "Hvala svima na odličnom radu ovog mjeseca! 🙏",
    "Nova ažuriranja su dostupna u aplikaciji 📱"
  ];

  const tabs = [
    { id: 'send', label: 'Pošalji poruku', icon: Send },
    { id: 'stats', label: 'Statistike', icon: BarChart3 },
    { id: 'debug', label: 'Debug System', icon: Bug }
  ];

  return (
    <div className={`min-h-screen p-6 ${
      isNightTheme 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800'
    }`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-3 rounded-full ${
            isNightTheme ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-600'
          }`}>
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Push Notifikacije</h1>
            <p className={`text-sm ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
              Pošaljite poruke svim vozačima
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === tab.id
                ? (isNightTheme 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'bg-purple-600 text-white shadow-lg')
                : (isNightTheme 
                    ? 'bg-white/10 text-gray-300 hover:bg-white/20' 
                    : 'bg-white text-gray-600 hover:bg-gray-50')
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Registration Status */}
            {!isRegistered && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border-2 border-dashed ${
                  isNightTheme 
                    ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-300' 
                    : 'border-yellow-400 bg-yellow-50 text-yellow-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Push notifikacije nisu aktivne</h4>
                    <p className="text-sm mb-3">
                      Da biste primili push notifikacije, morate ih prvo aktivirati u browseru.
                    </p>
                    <button
                      onClick={registerForPushNotifications}
                      disabled={registering}
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        registering
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                    >
                      {registering ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Aktiviranje...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4" />
                          Aktiviraj push notifikacije
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Send Message Card */}
            <div className={`p-6 rounded-xl shadow-lg ${
              isNightTheme ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5" />
                Nova poruka
              </h3>
              
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isNightTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Naslov poruke
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      isNightTheme 
                        ? 'bg-white/5 border-white/20 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="BD Evidencija"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isNightTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Sadržaj poruke
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className={`w-full p-3 rounded-lg border transition-colors resize-none ${
                      isNightTheme 
                        ? 'bg-white/5 border-white/20 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Unesite vašu poruku ovdje..."
                  />
                </div>

                {/* Target Type */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isNightTheme ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Pošalji
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className={`w-full p-3 rounded-lg border ${
                      isNightTheme 
                        ? 'bg-white/5 border-white/20 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Svim korisnicima</option>
                    <option value="drivers">Samo vozačima</option>
                    <option value="admins">Samo admin-ima</option>
                  </select>
                </div>

                {/* Send Button */}
                <div className="flex gap-3">
                  <button
                    onClick={sendPushMessage}
                    disabled={!message.trim() || sending}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      !message.trim() || sending
                        ? (isNightTheme ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed')
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {sending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Slanje...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Pošalji poruku
                      </>
                    )}
                  </button>

                  {isRegistered && (
                    <button
                      onClick={() => pushRegistrationService.sendTestNotification()}
                      className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isNightTheme 
                          ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      Test
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Messages */}
            <div className={`p-6 rounded-xl shadow-lg ${
              isNightTheme ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Brze poruke</h3>
              <div className="grid gap-2">
                {quickMessages.map((quickMsg, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(quickMsg)}
                    className={`text-left p-3 rounded-lg transition-colors ${
                      isNightTheme 
                        ? 'bg-white/5 hover:bg-white/10 text-gray-300' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {quickMsg}
                  </button>
                ))}
              </div>
            </div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                    : 'bg-red-500/20 border border-red-500/30 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{result.message}</span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className={`p-6 rounded-xl shadow-lg ${
            isNightTheme ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Push Notification Statistike
            </h3>
            
            {loadingStats ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
              </div>
            ) : pushStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${
                  isNightTheme ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Aktivni korisnici</span>
                  </div>
                  <div className="text-2xl font-bold">{pushStats.activeUsers || 0}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isNightTheme ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Poslano danas</span>
                  </div>
                  <div className="text-2xl font-bold">{pushStats.sentToday || 0}</div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  isNightTheme ? 'bg-white/5' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Ukupno poslano</span>
                  </div>
                  <div className="text-2xl font-bold">{pushStats.totalSent || 0}</div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 ${
                isNightTheme ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Nema dostupnih statistika
              </div>
            )}
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-lg ${
              isNightTheme ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Bug className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-semibold">Push System Debug</h3>
              </div>
              
              <p className={`mb-4 ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                Testira sve komponente push notifikacija sistema i prikazuje detaljnu dijagnostiku.
              </p>
              
              <motion.button
                onClick={openDebugger}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all mb-3 ${
                  isNightTheme
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                } shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bug className="w-5 h-5" />
                  Otvori Visual Debugger
                </div>
              </motion.button>

              <motion.button
                onClick={() => testDirectNotifications()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all mb-3 ${
                  isNightTheme
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                } shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="w-5 h-5" />
                  Test Direktne Notifikacije (lokalno)
                </div>
              </motion.button>

              <motion.button
                onClick={() => testServerPush()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isNightTheme
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } shadow-lg hover:shadow-xl`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Test Server Push (svi uređaji)
                </div>
              </motion.button>
              
              <div className={`mt-4 p-4 rounded-lg ${
                isNightTheme ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'
              }`}>
                <h4 className="font-semibold mb-2 text-orange-600">Šta debugger testira:</h4>
                <ul className={`text-sm space-y-1 ${isNightTheme ? 'text-gray-300' : 'text-gray-600'}`}>
                  <li>• Browser Notification API (desktop/mobile kompatibilnost)</li>
                  <li>• Service Worker registracija i funkcionalnost</li>
                  <li>• Push subscription status u bazi podataka</li>
                  <li>• VAPID ključevi i konfiguraciju</li>
                  <li>• AutoPushService komunikaciju</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}