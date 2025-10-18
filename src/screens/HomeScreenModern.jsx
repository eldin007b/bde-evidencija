import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Truck, 
  Users, 
  BarChart3, 
  Info, 
  Calendar,
  Clock,
  TrendingUp,
  Navigation,
  Zap,
  Sparkles,
  Bell,
  User,
  ChevronDown,
  LogOut,
  KeyRound,
  LayoutDashboard,
  Wallet,
  Crown,
  Activity
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import useSimpleAuth from "@/hooks/useSimpleAuth";
import { supabase } from "@/db/supabaseClient";
import { devLog, devWarn, devError } from "../utils/devLogger";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function HomeScreenModern() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [lastSyncData, setLastSyncData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Novi podatci sinhronizovani", time: "5 min", read: false },
    { id: 2, message: "GitHub scraper završen", time: "1h", read: false },
    { id: 3, message: "Payroll ažuriran", time: "2h", read: true }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ukupnaZarada, setUkupnaZarada] = useState("-");
  const [zadnjaPlata, setZadnjaPlata] = useState("-");
  const [payrollFiles, setPayrollFiles] = useState([]);
  
  // Modern UI State
  const [particles, setParticles] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('night');
  const [tiltStyles, setTiltStyles] = useState({});
  
  const navigate = useNavigate();
  const { currentUser: user, logout, changePassword } = useSimpleAuth();

  // Ime korisnika se uzima direktno iz useSimpleAuth hook-a
  const userName = user?.name || user?.ime || "Korisnik";

  // Dynamic Theme System
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
      background: 'from-slate-900 via-blue-900 to-indigo-900',
      accent: 'from-blue-400 to-cyan-400',
      particles: ['bg-blue-400/20', 'bg-cyan-400/20', 'bg-indigo-400/20']
    }
  };

  // Particle Background Component
  const ParticleBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color}`}
          style={{ 
            left: `${particle.x}%`, 
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(particle.id * 0.5) * 50, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );

  // 3D Tilt Effect Functions
  const handleMouseEnter = (e, cardIndex) => {
    handleMouseMove(e, cardIndex);
  };

  const handleMouseLeave = (cardIndex) => {
    resetTilt(cardIndex);
  };
  const handleMouseMove = (e, cardIndex) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    setTiltStyles(prev => ({
      ...prev,
      [cardIndex]: {
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: 'transform 0.1s ease-out'
      }
    }));
  };

  const resetTilt = (cardIndex) => {
    setTiltStyles(prev => ({
      ...prev,
      [cardIndex]: {
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'transform 0.3s ease-out'
      }
    }));
  };

  // ✅ Funkcija za formatiranje scraper statusa
  const getScraperStatus = () => {
    if (!lastSyncData) {
      return { text: "Nepoznato", color: "text-gray-500" };
    }
    
    if (lastSyncData.status === "completed") {
      return { text: "Uspešno", color: "text-emerald-500" };
    } else if (lastSyncData.status === "in_progress") {
      return { text: "U toku", color: "text-amber-500" };
    } else if (lastSyncData.status === "failure") {
      return { text: "Greška", color: "text-rose-500" };
    } else {
      return { text: "Nepoznato", color: "text-gray-500" };
    }
  };

  const formatScraperTime = () => {
    if (!lastSyncData) return "Nepoznato";
    
    const formatted = lastSyncData.formattedTimestamp;
    if (formatted) return formatted;

    const candidates = [
      lastSyncData.timestamp, 
      lastSyncData.raw?.updated_at, 
      lastSyncData.raw?.run_started_at, 
      lastSyncData.raw?.created_at
    ];

    for (const candidate of candidates) {
      if (candidate) {
        try {
          const date = new Date(candidate);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); 
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${day}.${month} ${hours}:${minutes}`;
          }
        } catch (e) {}
      }
    }
    return "Nepoznato";
  };

  // ✅ Funkcija za učitavanje payroll podataka
  const fetchPayroll = async () => {
    if (!user) return;
    try {
      // Dohvati ukupnu zaradu (sve neto)
      const { data, error } = await supabase
        .from("payroll_amounts")
        .select("neto")
        .eq("driver_name", user.name.toLowerCase());
      if (error) throw error;
      const totalNeto = data.reduce((sum, item) => sum + (item.neto || 0), 0);
      setUkupnaZarada(`${totalNeto.toFixed(2)} €`);
    } catch (err) {
      setUkupnaZarada("Greška");
    }
    // Dohvati zadnju platu iz najnovije platne liste (file_name)
    try {
      const { data, error } = await supabase
        .from("payroll_amounts")
        .select("neto, file_name, created_at")
        .eq("driver_name", user.name.toLowerCase())
        .order("file_name", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0 && typeof data[0].neto === 'number') {
        setZadnjaPlata(`${Number(data[0].neto).toFixed(2)} €`);
      } else {
        setZadnjaPlata("-");
      }
    } catch (err) {
      setZadnjaPlata("Greška");
    }
  };

  // Load payroll data on component mount
  useEffect(() => {
    if (user) {
      fetchPayroll();
    }
  }, [user]);

  // Računaj broj nepročitanih obavjesti
  const unreadCount = notifications.filter(n => !n.read).length;

  // GitHub API fallback funkcija
  const fetchGitHubWorkflows = async () => {
    try {
      devLog('🐙 Pokušavam da dohvatim podatke sa GitHub API...');

      // GitHub konfiguracija iz environment variables
      const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || import.meta.env.VITE_GITHUB_REPO_FALLBACK || 'eldin007b/gls-scraper';
      const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
      const [REPO_OWNER, REPO_NAME] = GITHUB_REPO.split('/');

      // Helper to format DD.MM HH:MM
      const formatToDDMMHHMM = (d) => {
        if (!d) return 'Nepoznato';
        const date = new Date(d);
        if (isNaN(date.getTime())) return 'Nepoznato';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month} ${hours}:${minutes}`;
      };

      // Prvo pokušaj sa token-om
      let response = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
          }
        }
      );

      // Ako je unauthorized i imamo token, pokušaj bez token-a
      if (!response.ok && response.status === 401 && GITHUB_TOKEN) {
        console.log('🔑 Token nevaljan, pokušavam bez token-a...');
        response = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=5`,
          {
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        const scraperWorkflows = (data.workflow_runs || []).filter(run => {
          const name = (run.name || '').toLowerCase();
          return name.includes('gls scraper') || name.includes('scraper') || name.includes('gls');
        });

        if (scraperWorkflows.length > 0) {
          const lastWorkflow = scraperWorkflows[0]; // Najnoviji
          console.log('✅ Našao GitHub workflow:', lastWorkflow);

          const isoTs = lastWorkflow.updated_at || lastWorkflow.run_started_at || lastWorkflow.created_at || new Date().toISOString();
          const formattedTimestamp = formatToDDMMHHMM(isoTs);

          const githubSyncData = {
            status: (lastWorkflow.conclusion === 'success' || lastWorkflow.conclusion === 'completed') ? 'completed' : (lastWorkflow.conclusion || 'unknown'),
            mode: 'Automatski (GitHub)',
            timestamp: isoTs, // ISO for machine parsing
            formattedTimestamp: formattedTimestamp, // human-friendly short format
            name: lastWorkflow.name,
            repoUsed: `${REPO_OWNER}/${REPO_NAME}`,
            raw: lastWorkflow
          };

          console.log('🔄 GitHub API podaci formatovani:', githubSyncData);
          setLastSyncData(githubSyncData);

          // Sačuvaj u localStorage za buduće (najnoviji prvi)
          try {
            localStorage.setItem('github_scraper_history', JSON.stringify([githubSyncData]));
          } catch (err) {
            console.warn('⚠️ Neuspjelo pisanje u localStorage:', err);
          }

          return true;
        }
      } else {
        console.warn('⚠️ GitHub API vratio nenormalan odgovor:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('💥 Greška pri GitHub API pozivu:', error);
    }

    // Ako ništa nije uspjelo, ne kvarimo postojeće lokalne podatke — vratimo false
    return false;
  };

  // Učitaj podatke o poslednjoj sinhronizaciji iz localStorage
  useEffect(() => {
    const loadLastSync = async () => {
      try {
        console.log('🔍 Pokušavam da učitam podatke o sinhronizaciji...');
        
        // Ispišimo sve ključeve u localStorage
        console.log('🗝️ Svi ključevi u localStorage:', Object.keys(localStorage));
        
        // First, actively attempt to fetch the latest GitHub workflow run and persist it.
        // This ensures scheduled GitHub workflows become visible in the UI without manual action.
        const attempted = await fetchGitHubWorkflows();
        if (attempted) {
          console.log('� GitHub fetch successful, reloading saved history...');
          const afterFetch = localStorage.getItem('github_scraper_history');
          if (afterFetch) {
            const history = JSON.parse(afterFetch);
            if (history.length > 0) {
              setLastSyncData(history[0]);
              return;
            }
          }
        }

        const scraperHistory = localStorage.getItem('github_scraper_history');
        console.log('📦 Raw podatci iz localStorage:', scraperHistory);
        
        if (scraperHistory) {
          const history = JSON.parse(scraperHistory);
          console.log('📋 Parsovana historija:', history);
          console.log('📏 Broj elemenata u historiji:', history.length);
          
          if (history.length > 0) {
            const lastSync = history[0]; // Prvi element je najnoviji
            console.log('⏰ Poslednja sinhronizacija:', lastSync);
            setLastSyncData(lastSync);
          } else {
            console.log('⚠️ Historija je prazna');
            setLastSyncData(null);
          }
        } else {
          console.log('❌ Nema podataka u localStorage za github_scraper_history');
          
          // Proveravamo da li postoji autoSyncState kao fallback
          const autoSyncState = localStorage.getItem('autoSyncState');
          if (autoSyncState) {
            try {
              const syncData = JSON.parse(autoSyncState);
              console.log('🔄 Koristim autoSyncState kao fallback:', syncData);
              
              // Kreiraj kompatibilne podatke iz autoSyncState
              const fallbackData = {
                status: "completed", // Pretpostavljamo da je sync uspešan
                mode: "Automatski",
                timestamp: syncData.lastSync ? new Date(syncData.lastSync).toLocaleString('bs-BA') : "Nepoznato"
              };
              console.log('🔄 Fallback podaci iz autoSync:', fallbackData);
              setLastSyncData(fallbackData);
            } catch (error) {
              console.error('💥 Greška u parsiranju autoSyncState:', error);
              // Ako nema ni autoSyncState, pokušaj GitHub API
              const githubSuccess = await fetchGitHubWorkflows();
              if (!githubSuccess) {
                setLastSyncData(null);
              }
            }
          } else {
            console.log('❌ Nema ni autoSyncState podataka - pokušavam GitHub API');
            // Ako nema lokalnih podataka, pokušaj GitHub API
            const githubSuccess = await fetchGitHubWorkflows();
            if (!githubSuccess) {
              setLastSyncData(null);
            }
          }
        }
      } catch (error) {
        console.error('💥 Greška prilikom učitavanja podataka o sinhronizaciji:', error);
        setLastSyncData(null);
      }
    };

    // Wrapper funkcija za async loadLastSync
    const initSync = async () => {
      await loadLastSync();
    };

    initSync();
    
    // Postavi interval da se podaci ažuriraju svakih 30 sekundi
    const interval = setInterval(() => {
      loadLastSync().catch(error => {
        console.error('💥 Greška u interval sync:', error);
      });
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Ažuriranje trenutnog vremena svakih 30 sekundi
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Ažurira se svakih 30 sekundi
    
    return () => clearInterval(timeInterval);
  }, []);

  // Generate Particles
  useEffect(() => {
    const generateParticles = () => {
      const currentThemeData = themes[currentTheme];
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        color: currentThemeData.particles[Math.floor(Math.random() * currentThemeData.particles.length)],
        duration: Math.random() * 25 + 15,
        delay: Math.random() * 8
      }));
      setParticles(newParticles);
    };
    generateParticles();
  }, [currentTheme]);

  // Fixed NIGHT Theme
  useEffect(() => {
    setCurrentTheme('night'); // Always use night theme
  }, []);

  // Parallax Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ Zatvaranje obavjesti klikom van
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Listen for force sync events from GitHubTab
  useEffect(() => {
    const handler = (e) => {
      try {
        const detail = e.detail;
        console.log('🔔 Primljen githubSync:updated event:', detail);
        if (detail) {
          // Preserve machine-friendly ISO `timestamp` when present and expose `formattedTimestamp` separately.
          const normalized = {
            ...detail,
            // If incoming payload wrongly put formatted date into timestamp, try to keep ISO if available
            timestamp: detail.timestamp && typeof detail.timestamp === 'string' && detail.timestamp.indexOf('T') !== -1 ? detail.timestamp : (detail.raw?.updated_at || detail.raw?.run_started_at || detail.raw?.created_at || detail.timestamp),
            // Keep formattedTimestamp if provided; otherwise generate a short friendly one from ISO
            formattedTimestamp: detail.formattedTimestamp || (detail.timestamp ? (() => {
              try {
                const d = new Date(detail.timestamp);
                if (!isNaN(d.getTime())) {
                  const dd = d.getDate().toString().padStart(2, '0');
                  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                  const hh = d.getHours().toString().padStart(2, '0');
                  const min = d.getMinutes().toString().padStart(2, '0');
                  return `${dd}.${mm} ${hh}:${min}`;
                }
              } catch (err) {
                // ignore
              }
              return detail.timestamp;
            })() : detail.timestamp)
          };
          setLastSyncData(normalized);
        }
      } catch (err) {
        console.error('Greška u event handleru:', err);
      }
    };

    window.addEventListener('githubSync:updated', handler);
    return () => window.removeEventListener('githubSync:updated', handler);
  }, []);

  const formatLastSync = () => {
    // Map status to a human-friendly Bosnian string
    if (!lastSyncData) return 'Nepoznato';

    const status = (lastSyncData.status || '').toString().toLowerCase();
    switch (status) {
      case 'completed':
      case 'success':
        return 'Uspješno';
      case 'in_progress':
      case 'running':
        return 'U toku';
      case 'failure':
      case 'failed':
        return 'Neuspješno';
      default:
        // If mode or source present, show that, otherwise unknown
        return lastSyncData.mode || lastSyncData.source || 'Nepoznato';
    }
  };

  const formatDataOd = () => {
    if (!lastSyncData) return 'Nepoznato';
    // Prefer explicit formattedTimestamp for display if available
    const formatted = lastSyncData.formattedTimestamp;
    if (formatted) return formatted;

    // Try ISO timestamp field
    const candidates = [lastSyncData.timestamp, lastSyncData.raw?.updated_at, lastSyncData.raw?.run_started_at, lastSyncData.raw?.created_at];
    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        const d = new Date(candidate);
        if (!isNaN(d.getTime())) {
          const day = d.getDate().toString().padStart(2, '0');
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const hours = d.getHours().toString().padStart(2, '0');
          const minutes = d.getMinutes().toString().padStart(2, '0');
          return `${day}.${month} ${hours}:${minutes}`;
        }
      } catch (err) {
        // ignore and try next
      }
    }

    // As a last resort, if timestamp is a string return a short slice
    if (typeof lastSyncData.timestamp === 'string') return lastSyncData.timestamp.slice(0, 16);
    return 'Nepoznato';
  };

  const getSyncStatus = () => {
    console.log('🎨 getSyncStatus pozvan sa lastSyncData:', lastSyncData);
    
    if (!lastSyncData) {
      console.log('❌ Nema podataka za status - vraćam gray');
      return { color: "text-gray-500", bgColor: "bg-gray-400" };
    }
    
    console.log('📊 Status sinhronizacije:', lastSyncData.status);
    
    if (lastSyncData.status === "completed") {
      return { color: "text-green-500", bgColor: "bg-green-400" };
    } else if (lastSyncData.status === "in_progress") {
      return { color: "text-yellow-500", bgColor: "bg-yellow-400" };
    } else if (lastSyncData.status === "failure") {
      return { color: "text-red-500", bgColor: "bg-red-400" };
    } else {
      return { color: "text-blue-500", bgColor: "bg-blue-400" };
    }
  };

  const handleLogout = () => {
    if (window.confirm('Da li ste sigurni da se želite odjaviti?')) {
      logout();
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  // Removed lastSync and sync info

  const menuItems = [
    {
      title: "Statistika",
      desc: "Grafovi i izvještaji",
      icon: <BarChart3 className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/statistika",
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "from-purple-600 to-pink-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      title: "Navigacija",
      desc: "Mapa i praćenje ruta",
      icon: <Navigation className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/navigacija",
      gradient: "from-indigo-500 to-blue-500",
      hoverGradient: "from-indigo-600 to-blue-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600"
    },
    {
      title: "Dostava",
      desc: "Pregled po mjesecu",
      icon: <Truck className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/deliveries",
      gradient: "from-blue-500 to-cyan-500",
      hoverGradient: "from-blue-600 to-cyan-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      title: "Vozači",
      desc: "Detaljna statistika po vozaču",
      icon: <Users className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/drivers",
      gradient: "from-emerald-500 to-teal-500",
      hoverGradient: "from-emerald-600 to-teal-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
    {
      title: "Extra vožnje",
      desc: "Posebne ture (Sonderfahrt)",
      icon: <MapPin className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/extra-rides",
      gradient: "from-orange-500 to-red-500",
      hoverGradient: "from-orange-600 to-red-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      title: "O aplikaciji",
      desc: "Informacije i pomoć",
      icon: <Info className="w-8 h-8 md:w-10 md:h-10" />,
      path: "/about",
      gradient: "from-gray-500 to-slate-500",
      hoverGradient: "from-gray-600 to-slate-600",
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600"
    },
  ];

  return (
    <>
      <div className={`min-h-screen bg-gradient-to-br ${themes[currentTheme].background} relative transition-all duration-1000`}>
        {/* Interactive Particle Background */}
        <ParticleBackground />
        
        {/* Enhanced Background decorative elements with parallax */}
        <div className="absolute inset-0 opacity-30">
          <motion.div 
            style={{ 
              transform: `translateY(${scrollY * 0.2}px) translateX(${scrollY * 0.1}px)`,
            }}
            className={`absolute top-20 left-10 w-96 h-96 bg-gradient-to-r ${themes[currentTheme].accent} rounded-full mix-blend-multiply filter blur-3xl`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            style={{ 
              transform: `translateY(${scrollY * -0.15}px) translateX(${scrollY * -0.05}px)`,
            }}
            className="absolute top-40 right-10 w-80 h-80 bg-gradient-to-r from-yellow-400/40 to-pink-400/40 rounded-full mix-blend-multiply filter blur-2xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
          <motion.div 
            style={{ 
              transform: `translateY(${scrollY * 0.25}px) translateX(${scrollY * -0.08}px)`,
            }}
            className="absolute -bottom-8 left-20 w-72 h-72 bg-gradient-to-r from-emerald-400/30 to-blue-400/30 rounded-full mix-blend-multiply filter blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-start py-8 px-4">
          <div className="w-full max-w-6xl mx-auto">
            {/* Ultra Modern Responsive Header with Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 relative z-[1000]"
              style={{ 
                transform: `translateY(${scrollY * 0.1}px)`,
              }}
            >
              <div className={`${currentTheme === 'night' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-3xl border ${currentTheme === 'night' ? 'border-white/10' : 'border-white/30'} rounded-3xl p-4 md:p-6 shadow-2xl relative`}>
                {/* Enhanced Decorative gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${themes[currentTheme].accent.replace('from-', 'from-').replace('to-', 'to-')}/10 rounded-3xl`}></div>
                
                {/* Animated border gradient */}
                <motion.div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${themes[currentTheme].accent} p-[1px]`}
                  animate={{
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className={`w-full h-full rounded-3xl ${currentTheme === 'night' ? 'bg-gray-800/20' : 'bg-white/20'} backdrop-blur-3xl`}></div>
                </motion.div>
                
                {/* Responsive Flex Layout */}
                <div className="relative z-10">
                  
                  {/* Mobile Layout: Title on top, Date + UserMenu below */}
                  <div className="flex flex-col lg:hidden gap-4">
                    {/* App Title - Centered on Mobile & Tablet */}
                    <div className="text-center">
                      <div className="relative">
                        {/* Mobile & Tablet - Modern glassmorphism title */}
                        <div className="relative inline-block">
                          <div 
                            className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30"
                            style={{
                              transform: 'scale(1.1)',
                              filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.3))'
                            }}
                          ></div>
                          <h1 
                            className="relative text-2xl sm:text-3xl md:text-4xl font-black tracking-wider leading-tight text-slate-800 px-4 py-2 md:px-6 md:py-3"
                            style={{
                              textShadow: '1px 1px 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.6)',
                              fontWeight: '900',
                              letterSpacing: '0.05em'
                            }}
                          >
                            B&D Evidencija
                          </h1>
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Date + UserMenu Row */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="flex items-center justify-between gap-3"
                    >
                      {/* Date pill */}
                      <div className="relative">
                        <div 
                          className="absolute inset-0 bg-white/25 backdrop-blur-sm rounded-full border border-white/30"
                          style={{
                            filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.2))'
                          }}
                        ></div>
                        <div 
                          className="relative flex items-center gap-2 px-3 py-1.5"
                        >
                        <Calendar className="w-3 h-3 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-800" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
                          {(() => {
                            const day = currentTime.getDate().toString().padStart(2, '0');
                            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
                            const year = currentTime.getFullYear();
                            const hours = currentTime.getHours().toString().padStart(2, '0');
                            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                            return `${day}.${month}.${year} ${hours}:${minutes}`;
                          })()}
                        </span>
                        </div>
                      </div>
                      
                      {/* UserMenu */}
                      <UserMenu
                        user={{ ...user, ukupnaZarada, zadnjaPlata }}
                        onChangePassword={() => setIsChangePasswordOpen(true)}
                        onLogout={logout}
                        currentTheme={currentTheme}
                        themes={themes}
                      />
                    </motion.div>
                  </div>

                  {/* Desktop Layout: Horizontal layout for large screens */}
                  <div className="hidden lg:flex lg:items-center lg:justify-between gap-4">
                    
                    {/* Left: App Title */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        {/* Desktop - Modern glassmorphism title */}
                        <div className="relative inline-block">
                          <div 
                            className="absolute inset-0 bg-white/25 backdrop-blur-md rounded-2xl border border-white/40"
                            style={{
                              transform: 'scale(1.1)',
                              filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.3))'
                            }}
                          ></div>
                          <h1 
                            className="relative text-3xl md:text-4xl font-black tracking-wide text-slate-800 px-6 py-3"
                            style={{
                              textShadow: '2px 2px 4px rgba(255,255,255,0.8), 0 0 6px rgba(255,255,255,0.6)',
                              fontWeight: '900',
                              letterSpacing: '0.05em'
                            }}
                          >
                            B&D Evidencija
                          </h1>
                        </div>
                        
                      </div>
                    </div>
                    
                    {/* Center: Date & Time Info */}
                    <div className="flex justify-center flex-1">
                      {/* Date & Time pill */}
                      <div className="relative">
                        <div 
                          className="absolute inset-0 bg-white/25 backdrop-blur-md rounded-full border border-white/30"
                          style={{
                            filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.25))'
                          }}
                        ></div>
                        <div className="relative flex items-center gap-2 px-4 py-2">
                        <Calendar className="w-4 h-4 text-slate-700" />
                        <span className="text-sm font-semibold text-slate-800" style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}>
                          {(() => {
                            const day = currentTime.getDate().toString().padStart(2, '0');
                            const month = (currentTime.getMonth() + 1).toString().padStart(2, '0');
                            const year = currentTime.getFullYear();
                            const hours = currentTime.getHours().toString().padStart(2, '0');
                            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
                            return `${day}.${month}.${year} ${hours}:${minutes}`;
                          })()}
                        </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: UserMenu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      className="flex items-center gap-3 justify-end flex-shrink-0"
                    >
                      {/* UserMenu */}
                      <UserMenu
                        user={{ ...user, ukupnaZarada, zadnjaPlata }}
                        onChangePassword={() => setIsChangePasswordOpen(true)}
                        onLogout={logout}
                        currentTheme={currentTheme}
                        themes={themes}
                      />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Menu Cards Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {menuItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.6 + (index * 0.1),
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    y: -12,
                    scale: 1.05,
                    rotateX: 5,
                    rotateY: 5,
                    transition: { duration: 0.3 }
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group perspective-1000"
                  style={{
                    transformStyle: 'preserve-3d',
                    ...tiltStyles[`card-${index}`]
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, `card-${index}`)}
                  onMouseLeave={() => handleMouseLeave(`card-${index}`)}
                  onMouseMove={(e) => handleMouseMove(e, `card-${index}`)}
                >
                  <Card
                    className={`cursor-pointer relative overflow-hidden ${currentTheme === 'night' 
                      ? 'bg-gray-800/30 shadow-inner shadow-gray-900/20' 
                      : 'bg-white/40 shadow-inner shadow-gray-300/20'
                    } backdrop-blur-2xl border-0 transition-all duration-500 rounded-3xl p-4 md:p-8 min-h-[180px] md:h-auto flex flex-col justify-between group-hover:shadow-2xl group-hover:backdrop-blur-3xl`}
                    style={{
                      boxShadow: currentTheme === 'night' 
                        ? '12px 12px 24px rgba(0,0,0,0.5), -12px -12px 24px rgba(255,255,255,0.02), inset 2px 2px 6px rgba(255,255,255,0.1)'
                        : '12px 12px 24px rgba(0,0,0,0.1), -12px -12px 24px rgba(255,255,255,0.8), inset 2px 2px 6px rgba(255,255,255,0.5)',
                      transformStyle: 'preserve-3d',
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    {/* Animated gradient background */}
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-3xl`}
                      initial={{ opacity: 0 }}
                      whileHover={{ 
                        opacity: 0.15,
                        scale: 1.1,
                      }}
                      transition={{ duration: 0.4 }}
                    />
                    
                    {/* Animated particles overlay */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 0.3 }}
                    >
                      <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse" 
                           style={{ animationDelay: '0ms' }} />
                      <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse" 
                           style={{ animationDelay: '200ms' }} />
                      <div className="absolute bottom-3 left-4 w-1.5 h-1.5 bg-white rounded-full animate-pulse" 
                           style={{ animationDelay: '400ms' }} />
                      <div className="absolute bottom-2 right-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" 
                           style={{ animationDelay: '600ms' }} />
                    </motion.div>
                    
                    {/* 3D Icon background with neumorphism */}
                    <motion.div 
                      className={`w-12 h-12 md:w-16 md:h-16 ${item.bgColor} rounded-2xl flex items-center justify-center mb-2 md:mb-6 relative z-10`}
                      style={{
                        boxShadow: currentTheme === 'night'
                          ? '6px 6px 12px rgba(0,0,0,0.6), -6px -6px 12px rgba(255,255,255,0.05), inset 2px 2px 4px rgba(255,255,255,0.1)'
                          : '6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.9), inset 2px 2px 4px rgba(255,255,255,0.7)'
                      }}
                      whileHover={{ 
                        scale: 1.15,
                        rotateY: 15,
                        rotateX: 15,
                        transition: { duration: 0.3 }
                      }}
                      initial={{ rotateY: 0, rotateX: 0 }}
                    >
                      <motion.div 
                        className={item.iconColor}
                        whileHover={{
                          rotate: [0, 5, -5, 0],
                          scale: 1.1,
                        }}
                        transition={{
                          rotate: { duration: 0.5, ease: "easeInOut" },
                          scale: { duration: 0.2 }
                        }}
                      >
                        {item.icon}
                      </motion.div>
                      
                      {/* Icon shine effect */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0"
                        whileHover={{ 
                          opacity: 1,
                          backgroundPosition: ['0% 0%', '100% 100%']
                        }}
                        transition={{ duration: 0.6 }}
                      />
                    </motion.div>
                    
                    {/* Enhanced Content */}
                    <div className="relative z-10 flex-1 flex flex-col">
                      <motion.h3 
                        className={`text-sm md:text-xl font-bold mb-1 md:mb-2 ${currentTheme === 'night' ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900'} transition-colors leading-tight`}
                        whileHover={{
                          scale: 1.05,
                          x: 2,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.title}
                      </motion.h3>
                      <motion.p 
                        className={`text-xs md:text-base ${currentTheme === 'night' ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-700'} transition-colors leading-relaxed mt-2`}
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1, y: -1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.desc}
                      </motion.p>
                    </div>
                    
                    {/* Animated arrow indicator */}
                    <motion.div 
                      className="absolute top-4 md:top-6 right-4 md:right-6 z-20"
                      initial={{ opacity: 0, x: -10, rotate: -45 }}
                      whileHover={{ 
                        opacity: 1, 
                        x: 0, 
                        rotate: 0,
                        scale: 1.2,
                        transition: { duration: 0.3 }
                      }}
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -2, 0],
                          rotate: [0, 5, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <TrendingUp className={`w-4 h-4 md:w-5 md:h-5 ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-500'}`} />
                      </motion.div>
                    </motion.div>
                    
                    {/* Bottom gradient line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Enhanced Copyright Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-16 text-center relative z-10"
            >
              <motion.div 
                className={`${currentTheme === 'night' ? 'bg-gray-800/30' : 'bg-white/30'} backdrop-blur-xl rounded-2xl p-6 border ${currentTheme === 'night' ? 'border-white/10' : 'border-gray-200/30'} relative overflow-hidden`}
                style={{
                  boxShadow: currentTheme === 'night'
                    ? '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.02)'
                    : '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.8)'
                }}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                {/* Animated background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${themes[currentTheme].accent} opacity-5`}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: '200% 200%',
                  }}
                />
                
                <motion.p 
                  className={`text-sm ${currentTheme === 'night' ? 'text-gray-300' : 'text-gray-600'} relative z-10`}
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  © {new Date().getFullYear()} B&D Evidencija. Sva prava zadržana.
                  <motion.span
                    className="inline-block ml-2"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    ✨
                  </motion.span>
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChangePassword={changePassword}
        loading={false}
      />
    </>
  );
}