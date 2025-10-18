import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from 'react';

/**
 * DriverInitScreen - Prvi ekran gdje vozač unosi svoju turu
 */
function DriverInitScreen({ onDriverSelected, loading }) {
  const [tura, setTura] = useState('');
  const [error, setError] = useState(null);
  const [focused, setFocused] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [highContrast, setHighContrast] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
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
        setTura('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!tura.trim()) {
      setError('Molimo unesite vašu turu');
      setShake(true);
      triggerHaptic();
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (tura.trim().length < 3) {
      setError('Tura mora imati najmanje 3 karaktera');
      setShake(true);
      triggerHaptic();
      setTimeout(() => setShake(false), 500);
      return;
    }

    setError(null);
    setShowSuccess(true);
    triggerHaptic();
    
    if (rememberDevice) {
      localStorage.setItem('rememberedTura', tura.trim().toUpperCase());
    }
    
    setTimeout(() => {
      onDriverSelected(tura.trim().toUpperCase());
    }, 800);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setTura(value);
    
    // Live validation
    if (value && value.length < 3) {
      setError('Tura mora imati najmanje 3 karaktera');
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
        {[...Array(20)].map((_, i) => (
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
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className={`absolute opacity-20 ${darkMode ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-blue-400 to-cyan-400'}`}
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              borderRadius: Math.random() * 50 + 25,
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 20 + 30,
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
        className={`w-full max-w-md ${cardClasses} rounded-2xl shadow-2xl p-8 flex flex-col gap-8 relative z-10`}
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
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-green-500 rounded"
                  initial={{ 
                    x: '50%', 
                    y: '50%',
                    scale: 0 
                  }}
                  animate={{
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 300 - 150,
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
          className="flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${darkMode ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.3)",
                "0 0 30px rgba(59, 130, 246, 0.5)",
                "0 0 20px rgba(59, 130, 246, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
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
            </svg>
          </motion.div>
          <motion.h1 
            className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Dobrodošli!
          </motion.h1>
          <motion.p 
            className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Molimo unesite vašu turu za pristup aplikaciji
          </motion.p>
        </motion.div>

        {/* Modern Form */}
                {/* Modern Form with Floating Labels */}
        <motion.form 
          onSubmit={handleSubmit} 
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative">
            <motion.input
              type="text"
              id="tura"
              value={tura}
              onChange={handleInputChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder=" "
              maxLength="10"
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
              htmlFor="tura"
              className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              } ${
                focused || tura 
                  ? '-top-2 text-xs bg-inherit px-2 font-medium' 
                  : 'top-3 text-base'
              }`}
              animate={{
                color: focused ? '#3b82f6' : darkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              Vaša tura
            </motion.label>

            {/* Input Icon with Animation */}
            <motion.span 
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${focused ? 'text-blue-400' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}
              animate={{
                rotate: focused ? 360 : 0,
                scale: focused ? 1.1 : 1
              }}
              transition={{ duration: 0.3 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <path d="m20 8 2 2-2 2"></path>
                <path d="m16 12-2-2 2-2"></path>
              </svg>
            </motion.span>

            {/* Typing Indicator */}
            {tura && !error && (
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

          {/* Remember Device Checkbox */}
          <motion.label 
            className="flex items-center gap-2 text-sm cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Zapamti ovaj uređaj
            </span>
          </motion.label>

          {/* Enhanced Submit Button with Ripple Effect */}
          <motion.button 
            type="submit" 
            className={`relative overflow-hidden w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-lg shadow transition-all duration-300 ${buttonClasses}`}
            disabled={loading || !tura.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          >
            {/* Ripple Effect */}
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.6 }}
              key={Math.random()}
            />
            
            {loading ? (
              <>
                <motion.span 
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Provjeravam...
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
                Nastavi
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Enhanced Modern Footer */}
        <motion.div 
          className="flex flex-col items-center gap-2 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.div 
            className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
              <motion.path 
                d="M18 20V10"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
              />
              <motion.path 
                d="M12 20V4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1.7 }}
              />
              <motion.path 
                d="M6 20v-6"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1.9 }}
              />
            </svg>
          </motion.div>
          <motion.p 
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            B&D Evidencija • Aplikacija za evidenciju vožnji
          </motion.p>
          <motion.div 
            className={`px-3 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-blue-800/50 text-blue-300' : 'bg-blue-100 text-blue-600'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.6, type: "spring", stiffness: 500, damping: 30 }}
            whileHover={{ scale: 1.1 }}
          >
            v5.0.0
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default DriverInitScreen;