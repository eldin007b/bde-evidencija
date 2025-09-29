import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';
import driversSync from '../services/driversSync';

/**
 * useAuth Hook - Auth layer koji koristi app_users tabelu
 * Fokus na: login, logout, session management, auth state
 */
export default function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Učitaj korisnika iz localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const userData = localStorage.getItem('bde_current_user');
      if (userData) {
        const user = JSON.parse(userData);
        // Provjeri da li je sesija još uvijek validna (24h)
        const loginTime = localStorage.getItem('bde_login_time');
        const now = Date.now();
        
        if (loginTime && (now - parseInt(loginTime)) < 24 * 60 * 60 * 1000) {
          return user;
        } else {
          // Sesija je istekla
          localStorage.removeItem('bde_current_user');
          localStorage.removeItem('bde_login_time');
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem('bde_current_user');
      localStorage.removeItem('bde_login_time');
    }
    return null;
  }, []);

  // Sačuvaj korisnika u localStorage
  const saveUserToStorage = useCallback((user) => {
    try {
      localStorage.setItem('bde_current_user', JSON.stringify(user));
      localStorage.setItem('bde_login_time', Date.now().toString());
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }, []);

  // Autentifikacija korisnika
  const authenticate = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Specijalan slučaj: 19102420/19102420 loguje Eldin-a (8610) sa admin privilegijama
      if (username === '19102420' && password === '19102420') {
        // Pronađi Eldin-a u bazi
        const { data: eldinUser, error: eldinError } = await supabase
          .from('app_users')
          .select('*')
          .eq('tura', '8610')
          .eq('active', true)
          .single();

        if (eldinError) {
          throw new Error('Eldin (8610) nije pronađen u bazi');
        }

        const authenticatedUser = {
          id: eldinUser.id,
          username: eldinUser.tura,
          name: eldinUser.ime,
          role: 'admin', // Admin uloga za ovaj login
          loginTime: Date.now(),
          isAdminLogin: true,
          device_id: eldinUser.device_id
        };

        setCurrentUser(authenticatedUser);
        saveUserToStorage(authenticatedUser);

        // Sinhronizuj sa drivers tabela
        await driversSync.syncUserToDriver(eldinUser.tura);
        
        return authenticatedUser;
      }

      // Normalan login - pozovi Supabase da pronađe korisnika
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tura', username)
        .eq('active', true)
        .single();

      if (error) {
        throw new Error('Korisnik nije pronađen ili nije aktivan');
      }

      // Provjeri lozinku
      if (users.password_hash !== password) {
        throw new Error('Neispravna lozinka');
      }

      const authenticatedUser = {
        id: users.id,
        username: users.tura,
        name: users.ime,
        role: users.role,
        loginTime: Date.now(),
        device_id: users.device_id,
        last_login: users.last_login
      };

      // Ažuriraj last_login
      await supabase
        .from('app_users')
        .update({ last_login: new Date() })
        .eq('id', users.id);

      setCurrentUser(authenticatedUser);
      saveUserToStorage(authenticatedUser);

      // Sinhronizuj sa drivers tabela
      await driversSync.syncUserToDriver(users.tura);

      return authenticatedUser;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveUserToStorage]);

  // Driver login (bez lozinke, samo tura broj)
  const loginDriver = useCallback(async (turaCode) => {
    setLoading(true);
    setError(null);

    try {
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tura', turaCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error) {
        throw new Error(`Vozač sa turom ${turaCode} nije pronađen ili nije aktivan`);
      }

      const userSession = {
        id: user.id,
        username: user.tura,
        name: user.ime,
        role: user.role || 'driver',
        loginTime: Date.now(),
        device_id: user.device_id,
        target_per_day: 0 // Će se učitati iz drivers tabele
      };

      // Ažuriraj last_login
      await supabase
        .from('app_users')
        .update({ last_login: new Date() })
        .eq('id', user.id);

      setCurrentUser(userSession);
      saveUserToStorage(userSession);

      // Sinhronizuj sa drivers tabela
      await driversSync.syncUserToDriver(user.tura);

      return userSession;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveUserToStorage]);

  // Logout
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('bde_current_user');
    localStorage.removeItem('bde_login_time');
    localStorage.removeItem('bde_driver_session'); // za kompatibilnost
    localStorage.removeItem('bde_driver_login_time');
  }, []);

  // Provjeri da li je korisnik ulogovan
  const isAuthenticated = useCallback(() => {
    return currentUser !== null;
  }, [currentUser]);

  // Provjeri da li je korisnik admin
  const isAdmin = useCallback(() => {
    return currentUser && currentUser.role === 'admin';
  }, [currentUser]);

  // Provjeri da li je korisnik vozač
  const isDriver = useCallback(() => {
    return currentUser && (currentUser.role === 'driver' || currentUser.role === 'user');
  }, [currentUser]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!currentUser?.username) return;

    try {
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tura', currentUser.username)
        .eq('active', true)
        .single();

      if (error || !user) {
        // User ne postoji ili nije aktivan - izloguj
        logout();
        return;
      }

      const updatedUser = {
        ...currentUser,
        name: user.ime,
        role: user.role,
        device_id: user.device_id,
        last_login: user.last_login
      };

      setCurrentUser(updatedUser);
      saveUserToStorage(updatedUser);

    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [currentUser, logout, saveUserToStorage]);

  // Load user on init
  useEffect(() => {
    const user = loadUserFromStorage();
    setCurrentUser(user);
    setLoading(false);
  }, [loadUserFromStorage]);

  return {
    // State
    currentUser,
    loading,
    error,
    
    // Auth methods
    authenticate,
    loginDriver,
    logout,
    refreshUser,
    
    // Auth checks
    isAuthenticated,
    isAdmin,
    isDriver,
    
    // Utils
    getCurrentUser: () => currentUser
  };
}