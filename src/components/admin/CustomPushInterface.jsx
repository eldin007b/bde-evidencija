import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Bell, Activity, CheckCircle, BarChart3 } from 'lucide-react';
import autoPushService from '../../services/AutoPushService';

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

  const isNightTheme = currentTheme === 'night';

  // Load simple stats
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStatistics();
    }
  }, [activeTab]);

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
      const response = await autoPushService.sendCustomMessage(message, title, targetType);
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
    { id: 'stats', label: 'Statistike', icon: BarChart3 }
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
                <button
                  onClick={sendPushMessage}
                  disabled={!message.trim() || sending}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
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
      </motion.div>
    </div>
  );
}