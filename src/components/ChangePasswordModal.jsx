import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, X, Check, AlertCircle } from 'lucide-react';

/**
 * ChangePasswordModal - Modern modal za promjenu lozinke
 */
function ChangePasswordModal({ isOpen, onClose, onChangePassword, loading }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  // Dynamic Theme System (isti kao HomeScreenModern)
  const themes = {
    default: {
      background: 'from-slate-50 via-blue-50 to-indigo-100',
      accent: 'from-blue-500 to-purple-500',
      particles: ['bg-blue-400/20', 'bg-purple-400/20', 'bg-indigo-400/20']
    },
    sunrise: {
      background: 'from-orange-50 via-pink-50 to-red-100', 
      accent: 'from-orange-500 to-pink-500',
      particles: ['bg-orange-400/20', 'bg-pink-400/20', 'bg-red-400/20']
    },
    afternoon: {
      background: 'from-amber-50 via-yellow-50 to-orange-100',
      accent: 'from-amber-500 to-orange-500',
      particles: ['bg-amber-400/20', 'bg-yellow-400/20', 'bg-orange-400/20']
    },
    evening: {
      background: 'from-purple-50 via-indigo-50 to-blue-100',
      accent: 'from-purple-500 to-indigo-500',
      particles: ['bg-purple-400/20', 'bg-indigo-400/20', 'bg-blue-400/20']
    },
    night: {
      background: 'from-gray-800 via-gray-900 to-black',
      accent: 'from-blue-400 to-purple-400',
      particles: ['bg-blue-300/30', 'bg-purple-300/30', 'bg-indigo-300/30']
    }
  };

  // Auto theme switching based on time
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) setCurrentTheme('sunrise');
      else if (hour >= 8 && hour < 12) setCurrentTheme('default');
      else if (hour >= 12 && hour < 17) setCurrentTheme('afternoon');
      else if (hour >= 17 && hour < 20) setCurrentTheme('evening');
      else setCurrentTheme('night');
    };
    
    updateTheme();
    const interval = setInterval(updateTheme, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!oldPassword.trim()) {
      setError('Molimo unesite staru lozinku');
      return;
    }

    if (!newPassword.trim()) {
      setError('Molimo unesite novu lozinku');
      return;
    }

    if (newPassword.length < 4) {
      setError('Nova lozinka mora imati najmanje 4 karaktera');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Nove lozinke se ne poklapaju');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await onChangePassword(oldPassword, newPassword);
      setSuccess(true);
      
      // Resetuj form nakon 2 sekunde i zatvori modal
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      setError(error.message || 'Greška pri promjeni lozinke');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  const isNightTheme = currentTheme === 'night';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className={`${isNightTheme ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r ${themes[currentTheme].accent} p-6 text-white relative`}>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Promjena lozinke</h2>
                  <p className="text-white/80 text-sm">Unesite staru i novu lozinku</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className={`text-xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-800'} mb-2`}>
                    Lozinka promijenjena!
                  </h3>
                  <p className={`${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                    Vaša lozinka je uspješno ažurirana.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Old Password */}
                  <div>
                    <label className={`block text-sm font-medium ${isNightTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Stara lozinka
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Unesite staru lozinku"
                      disabled={isSubmitting}
                      autoFocus
                      className={`w-full px-4 py-3 border ${isNightTheme ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all`}
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className={`block text-sm font-medium ${isNightTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Nova lozinka
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Unesite novu lozinku"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border ${isNightTheme ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all`}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className={`block text-sm font-medium ${isNightTheme ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Potvrdite novu lozinku
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ponovite novu lozinku"
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 border ${isNightTheme ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'} rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all`}
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2 p-4 ${isNightTheme ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-xl`}
                    >
                      <AlertCircle className={`w-5 h-5 ${isNightTheme ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
                      <p className={`text-sm ${isNightTheme ? 'text-red-300' : 'text-red-800'}`}>{error}</p>
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className={`flex-1 px-4 py-3 border ${isNightTheme ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} rounded-xl disabled:opacity-50 font-medium transition-all`}
                    >
                      Otkaži
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()}
                      className={`flex-1 px-4 py-3 bg-gradient-to-r ${themes[currentTheme].accent} text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg`}
                    >
                      {isSubmitting ? 'Mijenjam...' : 'Promijeni lozinku'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ChangePasswordModal;