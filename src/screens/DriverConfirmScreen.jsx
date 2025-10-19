import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from 'react';

/**
 * DriverConfirmScreen - Moderni ekran za potvrdu vozača prije login-a
 */
function DriverConfirmScreen({ driver, onContinue, onLogin, onBack, loading }) {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  // Detect system dark mode preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    const handler = (e) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setPassword('');
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Haptic feedback (mobile)
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Molimo unesite lozinku');
      setShake(true);
      triggerHaptic();
      setTimeout(() => setShake(false), 500);
      return;
    }

    setError(null);
    setShowSuccess(true);
    triggerHaptic();
    
    setTimeout(() => {
      onLogin(driver.tura, password, rememberMe);
    }, 800);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Live validation
    if (value && value.length < 4) {
      setError('Lozinka mora imati najmanje 4 karaktera');
    } else {
      setError(null);
    }
  };

  // Font size classes
  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  // Theme classes
  const themeClasses = darkMode 
    ? 'bg-gradient-to-br from-gray-900 to-blue-900 text-white'
    : 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800';
    
  const cardClasses = darkMode
    ? 'bg-gray-800/90 backdrop-blur-lg border border-gray-700/50'
    : 'bg-white/90 backdrop-blur-lg border border-white/50';

  const inputClasses = darkMode
    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400'
    : 'bg-white/80 border-gray-300 text-gray-800 placeholder-gray-500 focus:ring-blue-400';

  const buttonClasses = darkMode
    ? 'bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700'
    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300';
  
  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${themeClasses} ${fontSizeClasses[fontSize]} ${highContrast ? 'contrast-150' : ''}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400/20' : 'bg-blue-300/30'}`}
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className={`absolute opacity-20 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-cyan-400'}`}
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
              borderRadius: Math.random() * 40 + 20,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 15 + 25,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Settings Panel */}
      <div className="absolute top-4 right-4 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setDarkMode(!darkMode)}
          className={`w-10 h-10 rounded-full ${cardClasses} flex items-center justify-center`}
          title="Toggle Dark Mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setFontSize(fontSize === 'small' ? 'medium' : fontSize === 'medium' ? 'large' : 'small')}
          className={`w-10 h-10 rounded-full ${cardClasses} flex items-center justify-center text-sm`}
          title="Font Size"
        >
          Aa
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setHighContrast(!highContrast)}
          className={`w-10 h-10 rounded-full ${cardClasses} flex items-center justify-center`}
          title="High Contrast"
        >
          ⚫
        </motion.button>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          ...(shake && {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.5 }
          })
        }}
        className={`w-full max-w-lg ${cardClasses} rounded-2xl shadow-2xl p-8 flex flex-col gap-6 relative z-10`}
      >
        {/* Success Confetti */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-500 rounded"
                  initial={{ 
                    x: '50%', 
                    y: '50%',
                    scale: 0 
                  }}
                  animate={{
                    x: Math.random() * 250 - 125,
                    y: Math.random() * 250 - 125,
                    scale: 1,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modern Header with Custom Illustration */}
        <motion.div 
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${darkMode ? 'bg-gradient-to-br from-green-600 to-blue-600' : 'bg-gradient-to-br from-green-500 to-blue-500'}`}
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(34, 197, 94, 0.3)",
                "0 0 30px rgba(34, 197, 94, 0.5)",
                "0 0 20px rgba(34, 197, 94, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-white"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.3 }}
            >
              <motion.path 
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
              <motion.circle 
                cx="12" 
                cy="7" 
                r="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
            </motion.svg>
          </motion.div>
          <motion.h1 
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Vozač pronađen
          </motion.h1>
          <motion.p 
            className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Uspješno smo identificirali vaš profil
          </motion.p>
        </motion.div>

        {/* Modern Driver Card */}
        <motion.div 
          className={`${cardClasses} rounded-xl p-4 shadow-lg`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <motion.h2 
                className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                {driver.ime}
              </motion.h2>
              <div className="flex flex-col gap-2 mt-3">
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-700/50' : 'bg-blue-100'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-blue-300' : 'text-blue-600'}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <path d="m20 8 2 2-2 2"></path>
                      <path d="m16 12-2-2 2-2"></path>
                    </svg>
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Tura: {driver.tura}
                  </span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-purple-700/50' : 'bg-purple-100'}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-purple-300' : 'text-purple-600'}>
                      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
                      <path d="m19.4 15-1.1-2.3c-.4-.8-1.2-1.3-2.1-1.3H7.8c-.9 0-1.7.5-2.1 1.3L4.6 15"/>
                      <path d="M12 8v7"/>
                    </svg>
                  </span>
                  <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {driver.role === 'admin' ? 'Administrator' : 'Vozač'}
                  </span>
                </motion.div>
              </div>
            </div>

            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6 }}
            >
              {driver.hasPassword ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-green-800/50 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  <motion.svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <circle cx="12" cy="16" r="1"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </motion.svg>
                  <span className="text-sm font-medium">Već imate lozinku</span>
                </div>
              ) : (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-orange-800/50 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                  <motion.svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </motion.svg>
                  <span className="text-sm font-medium">Potrebno je postaviti lozinku</span>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>

        {driver.hasPassword ? (
          // Modern Login Form with Floating Labels
          <motion.form 
            onSubmit={handleLoginSubmit} 
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <div className="relative">
              <motion.input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={handleInputChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder=" "
                disabled={loading}
                autoFocus
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-lg peer transition-all duration-300 ${inputClasses}`}
                animate={{
                  scale: focused ? 1.02 : 1,
                  boxShadow: focused 
                    ? "0 0 20px rgba(59, 130, 246, 0.3)" 
                    : "0 0 0px rgba(59, 130, 246, 0)"
                }}
              />
              
              {/* Floating Label */}
              <motion.label
                htmlFor="password"
                className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                } ${
                  focused || password 
                    ? '-top-2 text-xs bg-inherit px-2 font-medium' 
                    : 'top-3 text-base'
                }`}
                animate={{
                  color: focused ? '#3b82f6' : darkMode ? '#9ca3af' : '#6b7280'
                }}
              >
                Lozinka
              </motion.label>

              {/* Password Toggle Button */}
              <motion.button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    // Eye slash (hide password)
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <path d="m1 1 22 22"/>
                    </>
                  ) : (
                    // Eye (show password)
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  )}
                </svg>
              </motion.button>

              {/* Typing Indicator */}
              {password && !error && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="absolute right-12 top-1/2 -translate-y-1/2"
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-1 bg-green-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Enhanced Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.8 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.8 }}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${
                    darkMode 
                      ? 'bg-red-900/20 border-red-800 text-red-400' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <motion.svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="text-red-500"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </motion.svg>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me Checkbox */}
            <motion.label 
              className="flex items-center gap-2 text-sm cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Zapamti me
              </span>
            </motion.label>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-3 mt-4">
              <motion.button 
                type="button" 
                className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-lg border transition-all duration-300 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                onClick={onBack}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Nazad
              </motion.button>
              
              <motion.button 
                type="submit" 
                className={`flex-2 relative overflow-hidden flex items-center justify-center gap-2 font-semibold py-3 rounded-lg shadow transition-all duration-300 ${buttonClasses}`}
                disabled={loading || !password.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              >
                {/* Ripple Effect */}
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                />
                
                {loading ? (
                  <>
                    <motion.span 
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Prijavljivam...
                  </>
                ) : showSuccess ? (
                  <>
                    <motion.svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <path d="m9 12 2 2 4-4"/>
                      <circle cx="12" cy="12" r="10"/>
                    </motion.svg>
                    Uspješno!
                  </>
                ) : (
                  <>
                    <motion.svg 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <path d="m9 18 6-6-6-6"/>
                    </motion.svg>
                    Prijavite se
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        ) : (
          // Modern Continue Actions for Password Setup
          <motion.div 
            className="flex gap-3 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
          >
            <motion.button 
              type="button" 
              className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-lg border transition-all duration-300 ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={onBack}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Nazad
            </motion.button>
            
            <motion.button 
              type="button" 
              className={`flex-2 relative overflow-hidden flex items-center justify-center gap-2 font-semibold py-3 rounded-lg shadow transition-all duration-300 ${buttonClasses}`}
              onClick={onContinue}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Ripple Effect */}
              <motion.div
                className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
              
              {loading ? (
                <>
                  <motion.span 
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Molim sačekajte...
                </>
              ) : (
                <>
                  <motion.svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </motion.svg>
                  Postavite lozinku
                </>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Enhanced Modern Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
        >
          <motion.div 
            className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
              <motion.rect 
                x="3" 
                y="11" 
                width="18" 
                height="11" 
                rx="2" 
                ry="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 2.2 }}
              />
              <motion.circle 
                cx="12" 
                cy="16" 
                r="1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 2.4 }}
              />
              <motion.path 
                d="M7 11V7a5 5 0 0 1 10 0v4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 2.0 }}
              />
            </svg>
          </motion.div>
          <motion.p 
            className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            Provjerite da li su podaci ispravni prije nastavka
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DriverConfirmScreen;