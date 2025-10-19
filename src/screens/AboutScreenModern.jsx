// AboutScreenModern.jsx
import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Rocket, Building2, User, Mail, Phone, BarChart3, Zap, FileText, Code, Package, Globe, Monitor, Layers } from 'lucide-react';
import { getAllDriversCloud, getTotalDeliveryCountCloud } from '../db/supabaseClient';

const CHANGELOG = [
  {
    version: '5.0.0',
    date: '06.10.2025',
      details: 'Kompletna modernizacija UI dizajna sa glassmorphism efektima, optimizacija performansi, dinamičke statistike iz baze podataka'
  },
  {
    version: '3.5.0',
    date: '05.10.2025',
    details: 'Dodana MapCard moderna sa poboljšanim blur efektima, novi Sidebar dizajn, optimizacija mobile responsivnosti'
  },
  {
    version: '3.4.0',
    date: '04.10.2025',
      details: 'Poboljšanja u DeliveryScreen - centriran naslov, validacija input polja, ograničavanje numeričkih vrednosti'
  },
  {
    version: '3.3.0',
    date: '03.10.2025',
    details: 'ExtraRidesScreen refaktorisanje - optimizovane boje za bolju preglednost, uklanjanje emoji ikona iz input polja'
  },
  {
    version: '3.2.0',
    date: '02.10.2025',
    details: 'Dodana validacija za PLZ i broj adresa, poboljšana UX sa placeholder tekstovima umesto alert poruka'
  },
  {
    version: '3.1.0',
    date: '01.10.2025',
      details: 'Pojačano upozorenje za reklamacije, poboljšanja u input validaciji, optimizacija korisničkog interfejsa'
  },
  {
    version: '3.0.0',
    date: '30.09.2025',
      details: 'Nova arhitektura aplikacije, PWA optimizacije, poboljšana sinhronizacija sa cloud bazom podataka'
  }
];

const AboutScreenModern = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState('5.0.0');
  const [currentTheme, setCurrentTheme] = useState('night');
  const [stats, setStats] = useState({
    users: 0,
    years: 0,
    deliveries: 0
  });

  // Fiksna NIGHT tema
  const themes = {
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900' }
  };

  const getThemeBackground = () => {
    const themeObj = themes[currentTheme] || themes['default'];
    return themeObj.background;
  };

  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/latest.json');
        const data = await response.json();
  setVersion(data.version || '5.0.0');
      } catch (error) {
  setVersion('5.0.0');
      }
    };

    fetchVersion();

    // Dohvati stvaran broj korisnika i dostava iz baze
    const fetchRealStats = async () => {
      try {
        // Dohvati aktivne vozače
        const drivers = await getAllDriversCloud();
        const realUserCount = drivers.length;
        
        // Dohvati ukupan broj dostava (suma iz sve kolone dostava)
        const realDeliveryCount = await getTotalDeliveryCountCloud();
        
        const animateCounters = () => {
          const targetStats = { 
            users: realUserCount, 
            years: 7, 
            deliveries: realDeliveryCount 
          };
          const duration = 2500;
          const steps = 120;

          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setStats({
              users: Math.min(targetStats.users, Math.round(targetStats.users * progress)),
              years: Math.min(targetStats.years, Math.round(targetStats.years * progress)),
              deliveries: Math.min(targetStats.deliveries, Math.round(targetStats.deliveries * progress))
            });

            if (currentStep >= steps) clearInterval(timer);
          }, duration / steps);
        };

        animateCounters();
      } catch (error) {
        console.error('Greška pri dohvatanju statistika:', error);
        // Fallback na hardkodirane podatke ako ne može da dohvati
        const animateCounters = () => {
          const targetStats = { users: 4, years: 7, deliveries: 1247 };
          const duration = 2500;
          const steps = 120;

          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            
            setStats({
              users: Math.min(targetStats.users, Math.round(targetStats.users * progress)),
              years: Math.min(targetStats.years, Math.round(targetStats.years * progress)),
              deliveries: Math.min(targetStats.deliveries, Math.round(targetStats.deliveries * progress))
            });

            if (currentStep >= steps) clearInterval(timer);
          }, duration / steps);
        };

        animateCounters();
      }
    };

    fetchRealStats();
  }, []);

  const handleContact = (type, value) => {
    if (type === 'email') {
      window.location.href = `mailto:${value}`;
    } else if (type === 'phone') {
      window.location.href = `tel:${value}`;
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeBackground()} transition-all duration-500`}>
      {/* Modern Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-900/80' : 'bg-white/80'} border-b ${currentTheme === 'night' ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-xl ${currentTheme === 'night' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'} shadow-lg transition-all`}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                O Aplikaciji
              </h1>
              <p className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                B&D Evidencija - PWA verzija
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Version Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8 text-center`}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Rocket className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          </motion.div>
          <h3 className={`text-3xl font-bold mb-2 ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
            Verzija {version}
          </h3>
          <p className={`text-lg ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-600'}`}>
            Moderna glassmorphism PWA
          </p>
        </motion.div>

        {/* Company & Contact Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8 text-center`}
          >
            <Building2 className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className={`text-xl font-bold mb-2 ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              B&D Kleintransporte KG
            </h3>
            <p className={`${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-600'}`}>
              Profesionalne transportne usluge
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8`}
          >
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className={`text-xl font-bold mb-2 ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
                Eldin Begić
              </h3>
              <p className={`${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-600'}`}>
                Developer & Support
              </p>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                onClick={() => handleContact('email', 'begic.prodaja@gmail.com')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${currentTheme === 'night' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-all shadow-lg`}
              >
                <Mail className="w-5 h-5" />
                Email
              </motion.button>
              <motion.button
                onClick={() => handleContact('phone', '06645875413')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${currentTheme === 'night' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white font-medium transition-all shadow-lg`}
              >
                <Phone className="w-5 h-5" />
                Pozovi
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8`}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <h3 className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Statistike
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className={`text-4xl font-bold mb-2 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.users}
              </div>
              <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                Korisnika
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className={`text-4xl font-bold mb-2 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.years}
              </div>
              <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                Godina rada
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <div className={`text-4xl font-bold mb-2 ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.deliveries}+
              </div>
              <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                Dostava
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8`}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-blue-500" />
            <h3 className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Tehnologije
            </h3>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { icon: Code, label: 'React' },
              { icon: Package, label: 'Supabase' },
              { icon: Globe, label: 'PWA' },
              { icon: Monitor, label: 'Responsive' },
              { icon: Layers, label: 'CSS3' },
              { icon: Zap, label: 'Vite' }
            ].map((tech, index) => (
              <motion.div
                key={tech.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/50 text-white' : 'bg-white/80 text-gray-800'} shadow-lg`}
              >
                <tech.icon className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{tech.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Changelog */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`backdrop-blur-xl ${currentTheme === 'night' ? 'bg-gray-800/50' : 'bg-white/50'} rounded-3xl shadow-2xl border ${currentTheme === 'night' ? 'border-gray-700' : 'border-white'} p-8`}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <FileText className="w-6 h-6 text-blue-500" />
            <h3 className={`text-2xl font-bold ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
              Historija Verzija
            </h3>
          </div>
          <div className="space-y-4">
            {CHANGELOG.map((item, index) => (
              <motion.div
                key={item.version}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className={`p-4 rounded-xl ${currentTheme === 'night' ? 'bg-gray-700/30' : 'bg-white/50'} border ${currentTheme === 'night' ? 'border-gray-600' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold text-lg ${currentTheme === 'night' ? 'text-blue-400' : 'text-blue-600'}`}>
                    {item.highlight ? '🎯' : '📌'} {item.version}
                  </span>
                  <span className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.date}
                  </span>
                </div>
                <p className={`text-sm ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item.details}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-8"
        >
          <div className={`text-lg font-semibold mb-1 ${currentTheme === 'night' ? 'text-white' : 'text-gray-800'}`}>
            © 2025 B&D Kleintransporte KG
          </div>
          <div className={`text-sm ${currentTheme === 'night' ? 'text-gray-400' : 'text-gray-600'}`}>
            Sva prava zadržana
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutScreenModern;