// src/utils/modernUtils.js
/**
 * 🛠️ MODERN UTILITY FUNCTIONS
 * ✅ Optimizovano za performance i sve uređaje
 * ✅ Type-safe sa proverama grešaka
 */

// 📱 DEVICE & ENVIRONMENT DETECTION
export const device = {
  isMobile: () => window.innerWidth < 768,
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => window.innerWidth >= 1024,
  isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  getOrientation: () => window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
};

// 🎨 COLOR & UI UTILITIES
export const colors = {
  getTrendColor: (value) => {
    if (typeof value !== 'number') return '#6b7280'; // neutral
    return value > 0 ? '#10b981' : value < 0 ? '#ef4444' : '#6b7280';
  },
  
  hexToRgba: (hex, alpha = 1) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` 
      : hex;
  },
  
  generateGradient: (color1, color2, angle = 135) => {
    return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
  }
};

// ⏱️ DATE & TIME UTILITIES
export const dateTime = {
  formatDate: (dateString, locale = 'de-DE') => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return String(dateString);
    }
  },
  
  formatTime: (dateString, locale = 'de-DE') => {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return '--';
    }
  },
  
  getCurrentMonth: () => {
    const months = [
      'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
      'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
    ];
    return months[new Date().getMonth()];
  },
  
  getCurrentYear: () => new Date().getFullYear()
};

// 📊 DATA & NUMBER UTILITIES
export const dataUtils = {
  formatNumber: (num, locale = 'de-DE') => {
    if (typeof num !== 'number' || isNaN(num)) return '--';
    return new Intl.NumberFormat(locale).format(num);
  },
  
  safeParseInt: (value, fallback = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? fallback : parsed;
  },
  
  calculateStats: (data, period, targetStops) => {
    if (!data || !Array.isArray(data)) {
      return { packages: 0, diff: period === 'day' ? -targetStops : 0, complaints: 0, trend: 'neutral' };
    }

    let packages = 0, complaints = 0, target = 0;

    if (period === 'day') {
      const record = data[0] || {};
      packages = dataUtils.safeParseInt(record.produktivitaet_stops);
      complaints = dataUtils.safeParseInt(record.probleme_druga);
      target = targetStops;
    } else {
      packages = data.reduce((sum, item) => sum + dataUtils.safeParseInt(item.produktivitaet_stops), 0);
      complaints = data.reduce((sum, item) => sum + dataUtils.safeParseInt(item.probleme_druga), 0);
      target = data.length * targetStops;
    }

    const diff = packages - target;
    const trend = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';

    return { packages, diff, complaints, trend };
  },
  
  // Za driver target stops based on tura
  getTargetStops: (tura) => {
    const targets = {
      '8610': 50,
      '8620': 85,
      '8630': 85,
      '8640': 80
    };
    return targets[tura] || 50;
  }
};

// 🎪 ANIMATION & INTERACTION UTILITIES
export const animations = {
  stagger: (index, baseDelay = 0.1) => ({
    animationDelay: `${index * baseDelay}s`
  }),
  
  createRipple: (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    
    const circle = document.createElement('span');
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-effect');
    
    // Remove existing ripples
    const existingRipples = button.getElementsByClassName('ripple-effect');
    while (existingRipples[0]) {
      existingRipples[0].remove();
    }
    
    button.appendChild(circle);
    
    // Auto-remove after animation
    setTimeout(() => {
      if (circle.parentNode === button) {
        button.removeChild(circle);
      }
    }, 600);
  },
  
  // Smooth scroll to element
  scrollToElement: (elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  }
};

// 💾 STORAGE UTILITIES (safe localStorage)
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      // Try to parse as JSON, if fails return as string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.warn('Storage get error:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, valueToStore);
      return true;
    } catch (error) {
      console.warn('Storage set error:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Storage remove error:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Storage clear error:', error);
      return false;
    }
  }
};

// 🚀 PERFORMANCE & DEBUGGING UTILITIES
export const performance = {
  measure: (fn, name = 'Function') => {
    if (process.env.NODE_ENV === 'development') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`⚡ ${name} executed in: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  },
  
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// 🔐 VALIDATION UTILITIES
export const validation = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isPhone: (phone) => {
    const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  },
  
  isEmpty: (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

// 📱 RESPONSIVE HELPERS
export const responsive = {
  // CSS media queries as JavaScript functions
  isMobile: () => window.matchMedia('(max-width: 767px)').matches,
  isTablet: () => window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
  isDesktop: () => window.matchMedia('(min-width: 1024px)').matches,
  
  // Orientation
  isPortrait: () => window.matchMedia('(orientation: portrait)').matches,
  isLandscape: () => window.matchMedia('(orientation: landscape)').matches,
  
  // High DPI screens
  isRetina: () => window.matchMedia('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)').matches
};

// 🎯 EXPORT DEFAULT SVE FUNKCJE ZA LAKŠI IMPORT
export default {
  device,
  colors,
  dateTime,
  dataUtils,
  animations,
  storage,
  performance,
  validation,
  responsive
};