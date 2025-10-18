/**
 * 🧪 Quick Push Test Interface
 * Brzo testiranje svih tipova push notifikacija
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Zap, Bell, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import smartPushService from '../../services/SmartPushService';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const QuickPushTestInterface = ({ currentTheme = 'night' }) => {
  const [selectedTest, setSelectedTest] = useState('statistics');
  const [testResults, setTestResults] = useState([]);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const isNightTheme = currentTheme === 'night';

  const testTemplates = {
    statistics: {
      title: '📊 Statistike ažurirane!',
      body: 'Tvoje dnevne statistike: 25 dostava, 450€ zarada',
      type: 'statistics',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500'
    },
    achievement: {
      title: '🏆 Novo postignuće!',
      body: 'Osvojio si "Savršen mesec" achievement!',
      type: 'achievement',
      icon: '🏆',
      color: 'from-yellow-500 to-orange-500'
    },
    payroll: {
      title: '💰 Platna lista dostupna!',
      body: 'Tvoja platna lista za ovaj mesec je spremna za preuzimanje',
      type: 'payroll',
      icon: '💰',
      color: 'from-green-500 to-emerald-500'
    },
    extra_ride: {
      title: '🚗 Nova extra vožnja!',
      body: 'Marko Petrović je dodao extra vožnju za odobravanje',
      type: 'extra_ride',
      icon: '🚗',
      color: 'from-purple-500 to-pink-500'
    },
    system: {
      title: '⚠️ Sistemska obavest!',
      body: 'Planirano je održavanje sistema u 02:00',
      type: 'system',
      icon: '⚠️',
      color: 'from-red-500 to-pink-500'
    },
    custom: {
      title: '📢 Custom obavest',
      body: customMessage || 'Test custom poruka',
      type: 'custom',
      icon: '📢',
      color: 'from-indigo-500 to-purple-500'
    }
  };

  const sendTestPush = async (testType = selectedTest) => {
    setSending(true);
    
    try {
      const template = testTemplates[testType];
      
      console.log('🧪 Sending test push:', template);
      
      // Add to results immediately with "sending" status
      const testId = Date.now();
      setTestResults(prev => [{
        id: testId,
        type: testType,
        template,
        status: 'sending',
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);

      // Simulate sending push notification
      const result = await smartPushService.sendPushNotification({
        userId: 'test-user',
        userRole: 'driver',
        title: template.title,
        body: template.body,
        type: template.type,
        data: {
          testMode: true,
          testId
        }
      });

      // Update result status
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: result.success ? 'success' : 'failed',
              result,
              completedAt: new Date().toLocaleTimeString()
            }
          : test
      ));

      console.log('✅ Test push result:', result);

    } catch (error) {
      console.error('❌ Test push failed:', error);
      
      setTestResults(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: 'failed',
              error: error.message,
              completedAt: new Date().toLocaleTimeString()
            }
          : test
      ));
    } finally {
      setSending(false);
    }
  };

  const sendAllTests = async () => {
    setSending(true);
    
    const testTypes = Object.keys(testTemplates).filter(t => t !== 'custom');
    
    for (const testType of testTypes) {
      await sendTestPush(testType);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setSending(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isNightTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
              Quick Push Tests
            </h3>
            <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
              Brzo testiranje svih tipova notifikacija
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearResults}
            disabled={testResults.length === 0}
            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
              isNightTheme 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-50'
            }`}
          >
            Očisti
          </button>
          
          <button
            onClick={sendAllTests}
            disabled={sending}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Šalje...' : 'Testiraj sve'}</span>
          </button>
        </div>
      </div>

      {/* Test Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {Object.entries(testTemplates).map(([key, template]) => (
          <motion.button
            key={key}
            onClick={() => key === 'custom' ? null : sendTestPush(key)}
            disabled={sending || (key === 'custom' && !customMessage.trim())}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-4 rounded-lg border transition-all text-left disabled:opacity-50 ${
              selectedTest === key
                ? `bg-gradient-to-r ${template.color} text-white border-transparent`
                : isNightTheme 
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {template.type.replace('_', ' ').toUpperCase()}
                </div>
                <div className={`text-xs mt-1 ${
                  selectedTest === key ? 'text-white/80' : isNightTheme ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {template.title}
                </div>
              </div>
            </div>
            
            {key === 'custom' && (
              <input
                type="text"
                placeholder="Custom poruka..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && customMessage.trim()) {
                    sendTestPush('custom');
                  }
                }}
                className={`w-full mt-2 p-2 text-sm rounded border ${
                  isNightTheme 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Results */}
      {testResults.length > 0 && (
        <div>
          <h4 className={`font-medium mb-3 ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
            Rezultati Testova ({testResults.length})
          </h4>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {testResults.map((test) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  test.status === 'success' 
                    ? `${isNightTheme ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}` 
                    : test.status === 'failed'
                    ? `${isNightTheme ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'}`
                    : `${isNightTheme ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {test.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                      {test.status === 'sending' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{test.template.icon}</span>
                        <span className={`font-medium text-sm ${
                          test.status === 'success' 
                            ? `${isNightTheme ? 'text-green-300' : 'text-green-700'}` 
                            : test.status === 'failed'
                            ? `${isNightTheme ? 'text-red-300' : 'text-red-700'}`
                            : `${isNightTheme ? 'text-yellow-300' : 'text-yellow-700'}`
                        }`}>
                          {test.type.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className={`text-xs mt-1 ${
                        test.status === 'success' 
                          ? `${isNightTheme ? 'text-green-400' : 'text-green-600'}` 
                          : test.status === 'failed'
                          ? `${isNightTheme ? 'text-red-400' : 'text-red-600'}`
                          : `${isNightTheme ? 'text-yellow-400' : 'text-yellow-600'}`
                      }`}>
                        {test.template.body}
                      </div>

                      {test.result && test.status === 'success' && (
                        <div className={`text-xs mt-1 ${isNightTheme ? 'text-green-400' : 'text-green-600'}`}>
                          Poslano na {test.result.sentTo}/{test.result.total} uređaja
                        </div>
                      )}

                      {test.error && (
                        <div className={`text-xs mt-1 ${isNightTheme ? 'text-red-400' : 'text-red-600'}`}>
                          Greška: {test.error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`text-xs ${
                    test.status === 'success' 
                      ? `${isNightTheme ? 'text-green-400' : 'text-green-600'}` 
                      : test.status === 'failed'
                      ? `${isNightTheme ? 'text-red-400' : 'text-red-600'}`
                      : `${isNightTheme ? 'text-yellow-400' : 'text-yellow-600'}`
                  }`}>
                    {test.completedAt || test.timestamp}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Push Status Info */}
      <div className={`mt-6 p-4 rounded-lg ${
        isNightTheme ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <div className="flex items-center space-x-2 mb-2">
          <Bell className={`w-4 h-4 ${isNightTheme ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-sm font-medium ${isNightTheme ? 'text-white' : 'text-gray-800'}`}>
            Push Status
          </span>
        </div>
        
        <div className={`text-xs ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
          • Test notifikacije se šalju na 'test-user' korisnika<br/>
          • Proverite da li su push settings uključeni<br/>
          • Rezultati se prikazuju u realnom vremenu
        </div>
      </div>
    </div>
  );
};

export default QuickPushTestInterface;