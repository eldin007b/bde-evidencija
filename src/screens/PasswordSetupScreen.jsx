import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * PasswordSetupScreen - Moderni ekran za postavljanje početne lozinke sa naprednim UI/UX funkcijama
 */
function PasswordSetupScreen({ driver, onPasswordSet, onBack, loading }) {
  // Core State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState('');

  // Modern UI State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState([]);

  // Password Strength State
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: 'Unesite lozinku'
  });

  // Theme Classes
  const themeClasses = {
    background: darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900' 
      : 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
    container: darkMode 
      ? 'bg-gray-800/40 backdrop-blur-xl border-gray-700/50' 
      : 'bg-white/40 backdrop-blur-xl border-white/50',
    card: darkMode 
      ? 'bg-gray-800/60 backdrop-blur-xl border-gray-700/50' 
      : 'bg-white/60 backdrop-blur-xl border-white/60',
    input: darkMode 
      ? 'bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:bg-gray-800/80' 
      : 'bg-white/60 border-gray-200 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:bg-white/80',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    accent: darkMode ? 'text-purple-400' : 'text-purple-600'
  };

  const containerClasses = `${themeClasses.container} ${
    fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
  } ${highContrast ? 'contrast-125' : ''}`;

  const cardClasses = `${themeClasses.card} ${
    highContrast ? 'shadow-2xl' : 'shadow-xl'
  }`;

  const inputClasses = `${themeClasses.input} ${
    highContrast ? 'shadow-inner border-2' : 'border'
  }`;

  // Password Strength Calculator
  const calculatePasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: 'Unesite lozinku' };
    
    let score = 0;
    let feedback = '';

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Normalize score to 1-4
    const normalizedScore = Math.min(Math.max(Math.floor(score / 1.5), 1), 4);

    switch (normalizedScore) {
      case 1:
        feedback = 'Slaba lozinka';
        break;
      case 2:
        feedback = 'Umjereno jaka lozinka';
        break;
      case 3:
        feedback = 'Jaka lozinka';
        break;
      case 4:
        feedback = 'Vrlo jaka lozinka';
        break;
      default:
        feedback = 'Unesite lozinku';
    }

    return { score: normalizedScore, feedback };
  };

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.1
      }));
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  // Theme management
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
  }, [highContrast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setDarkMode(!darkMode);
      }
      if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        setFontSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'large');
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        setFontSize(prev => prev === 'large' ? 'medium' : prev === 'medium' ? 'small' : 'small');
      }
      if (e.key === 'Escape') {
        setShowSettingsPanel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [darkMode]);

  // Confetti effect
  const generateConfetti = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      rotation: Math.random() * 360,
      scale: Math.random() * 0.8 + 0.4,
      color: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)]
    }));
    setConfettiParticles(particles);
    setTimeout(() => setConfettiParticles([]), 3000);
  };

  // Haptic feedback
  const triggerHaptic = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Molimo unesite oba polja');
      triggerHaptic();
      return;
    }

    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      triggerHaptic();
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Lozinka mora biti jača');
      triggerHaptic();
      return;
    }

    setError('');
    setShowSuccess(true);
    generateConfetti();

    try {
      await onPasswordSet(password, rememberMe);
    } catch (err) {
      setError(err.message || 'Greška pri postavljanju lozinke');
      setShowSuccess(false);
      triggerHaptic();
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden ${themeClasses.background}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className={`absolute w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400/20' : 'bg-purple-500/10'}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Confetti Effect */}
      <AnimatePresence>
        {confettiParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              left: `${particle.x}%`,
              backgroundColor: particle.color,
              rotate: particle.rotation,
              scale: particle.scale,
            }}
            initial={{ y: -50 }}
            animate={{ 
              y: window.innerHeight + 100,
              rotate: particle.rotation + 360 * 2,
              opacity: [1, 1, 0]
            }}
            transition={{ duration: 3, ease: "easeIn" }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            className="fixed top-4 right-4 z-50"
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
          >
            <div className={`${cardClasses} p-4 rounded-2xl border shadow-2xl min-w-[200px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${themeClasses.text}`}>Postavke</h3>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={themeClasses.text}>
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="rounded"
                  />
                  <span className={`text-sm ${themeClasses.text}`}>Tamna tema</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="rounded"
                  />
                  <span className={`text-sm ${themeClasses.text}`}>Visoki kontrast</span>
                </label>
                
                <div>
                  <label className={`text-sm ${themeClasses.text} block mb-1`}>Veličina fonta</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className={`w-full p-1 rounded text-sm ${inputClasses}`}
                  >
                    <option value="small">Mala</option>
                    <option value="medium">Srednja</option>
                    <option value="large">Velika</option>
                  </select>
                </div>
              </div>
              
              <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ctrl+D: Tamna tema<br/>
                  Ctrl++/-: Veličina fonta
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Toggle Button */}
      <motion.button
        onClick={() => setShowSettingsPanel(!showSettingsPanel)}
        className={`fixed top-4 right-4 z-40 p-3 rounded-full ${cardClasses} border shadow-lg transition-all duration-300 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={themeClasses.text}
          animate={{ rotate: showSettingsPanel ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <circle cx="12" cy="12" r="3"/>
          <path d="m12 1 1.7 1.7"/>
          <path d="m12 23-1.7-1.7"/>
          <path d="m5.6 5.6 1.4 1.4"/>
          <path d="m18.4 18.4-1.4-1.4"/>
          <path d="m1 12 1.7-1.7"/>
          <path d="m23 12-1.7 1.7"/>
          <path d="m5.6 18.4 1.4-1.4"/>
          <path d="m18.4 5.6-1.4 1.4"/>
        </motion.svg>
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div 
          className={`w-full max-w-md ${containerClasses} rounded-3xl border p-8 shadow-2xl space-y-8`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Modern Header with Custom Illustration */}
          <motion.div 
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${darkMode ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(168, 85, 247, 0.3)",
                  "0 0 30px rgba(168, 85, 247, 0.5)",
                  "0 0 20px rgba(168, 85, 247, 0.3)"
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
                <motion.rect 
                  x="3" 
                  y="11" 
                  width="18" 
                  height="11" 
                  rx="2" 
                  ry="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
                <motion.circle 
                  cx="12" 
                  cy="16" 
                  r="1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                />
                <motion.path 
                  d="M7 11V7a5 5 0 0 1 10 0v4"
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
              Postavite lozinku
            </motion.h1>
            <motion.p 
              className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Ovo je vaš prvi put. Molimo postavite lozinku za budući pristup.
            </motion.p>
          </motion.div>

          {/* Modern Driver Info Card */}
          <motion.div 
            className={`${cardClasses} rounded-xl p-4 shadow-lg`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-center gap-6">
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-purple-700/50' : 'bg-purple-100'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-purple-300' : 'text-purple-600'}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <strong>Vozač:</strong> {driver.ime}
                </span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-700/50' : 'bg-blue-100'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={darkMode ? 'text-blue-300' : 'text-blue-600'}>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                  </svg>
                </span>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <strong>Tura:</strong> {driver.tura}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Modern Password Form */}
          <motion.form 
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            {/* Password Input */}
            <motion.div 
              className="relative"
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="relative">
                <motion.input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 pt-6 pb-2 border-2 rounded-xl transition-all duration-300 ${inputClasses} peer ${error ? 'border-red-500 bg-red-50/50' : password ? 'border-purple-500 bg-purple-50/20' : ''}`}
                  placeholder=" "
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField('')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  disabled={loading}
                  autoFocus
                />
                <motion.label
                  className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    password || activeField === 'password'
                      ? `text-xs top-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                      : `text-base top-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  Lozinka
                </motion.label>
                <AnimatePresence>
                  {password && (
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Password Strength Indicator */}
              <AnimatePresence>
                {password && (
                  <motion.div 
                    className="mt-3 space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <motion.div
                          key={level}
                          className={`h-1 rounded-full flex-1 ${
                            level <= passwordStrength.score
                              ? passwordStrength.score === 1 ? 'bg-red-500'
                              : passwordStrength.score === 2 ? 'bg-orange-500'
                              : passwordStrength.score === 3 ? 'bg-yellow-500'
                              : 'bg-green-500'
                              : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: level <= passwordStrength.score ? 1 : 0 }}
                          transition={{ delay: level * 0.1 }}
                        />
                      ))}
                    </div>
                    <motion.p 
                      className={`text-sm ${
                        passwordStrength.score === 1 ? 'text-red-500'
                        : passwordStrength.score === 2 ? 'text-orange-500'
                        : passwordStrength.score === 3 ? 'text-yellow-500'
                        : 'text-green-500'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {passwordStrength.feedback}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div 
              className="relative"
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="relative">
                <motion.input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 pt-6 pb-2 border-2 rounded-xl transition-all duration-300 ${inputClasses} peer ${error ? 'border-red-500 bg-red-50/50' : confirmPassword ? 'border-purple-500 bg-purple-50/20' : ''}`}
                  placeholder=" "
                  onFocus={() => setActiveField('confirmPassword')}
                  onBlur={() => setActiveField('')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.0 }}
                  disabled={loading}
                />
                <motion.label
                  className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                    confirmPassword || activeField === 'confirmPassword'
                      ? `text-xs top-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`
                      : `text-base top-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                >
                  Potvrdite lozinku
                </motion.label>
                <AnimatePresence>
                  {confirmPassword && (
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Password Match Indicator */}
              <AnimatePresence>
                {confirmPassword && (
                  <motion.div 
                    className={`mt-2 flex items-center gap-2 text-sm ${
                      password === confirmPassword ? 'text-green-500' : 'text-red-500'
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {password === confirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                    )}
                    {password === confirmPassword ? 'Lozinke se poklapaju' : 'Lozinke se ne poklapaju'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className={`p-4 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-red-900/30 border border-red-800 text-red-300' : 'bg-red-50 border border-red-200 text-red-700'}`}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  className={`p-4 rounded-xl flex items-center gap-3 ${darkMode ? 'bg-green-900/30 border border-green-800 text-green-300' : 'bg-green-50 border border-green-200 text-green-700'}`}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  <motion.svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <polyline points="20,6 9,17 4,12"/>
                  </motion.svg>
                  Lozinka je uspješno postavljena! Ulogujemo vas...
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me Checkbox */}
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4 }}
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="sr-only"
                  />
                  <motion.div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                      rememberMe 
                        ? darkMode ? 'bg-purple-600 border-purple-600' : 'bg-purple-500 border-purple-500'
                        : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-purple-400'}`}
                    whileHover={!loading ? { scale: 1.05 } : {}}
                    whileTap={!loading ? { scale: 0.95 } : {}}
                  >
                    <AnimatePresence>
                      {rememberMe && (
                        <motion.svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <polyline points="20,6 9,17 4,12"/>
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'} ${loading ? 'opacity-50' : ''}`}>
                  Zapamti me
                </span>
              </label>
            </motion.div>

            {/* Action Buttons */}
            <motion.div 
              className="flex gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6 }}
            >
              <motion.button
                type="button"
                onClick={onBack}
                disabled={loading}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Nazad
              </motion.button>

              <motion.button
                type="submit"
                disabled={loading || !password.trim() || !confirmPassword.trim() || password !== confirmPassword || passwordStrength.score < 2}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  loading || !password.trim() || !confirmPassword.trim() || password !== confirmPassword || passwordStrength.score < 2
                    ? darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : darkMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                } hover:shadow-lg`}
                whileHover={!loading && password.trim() && confirmPassword.trim() && password === confirmPassword && passwordStrength.score >= 2 ? { scale: 1.02 } : {}}
                whileTap={!loading && password.trim() && confirmPassword.trim() && password === confirmPassword && passwordStrength.score >= 2 ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Postavljam i ulogujem...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Postavi lozinku i uloguj se
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>

          {/* Modern Footer */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8 }}
          >
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Lozinka će biti automatski sačuvana i ulogovani ćete se odmah.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PasswordSetupScreen;