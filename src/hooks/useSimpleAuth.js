import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';

/**
 * 🔒 Helper: Generiše SHA-256 hash lozinke
 */
async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * useSimpleAuth Hook - Novi jednostavan auth sistem
 * Koristi samo drivers tabelu
 */
export default function useSimpleAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Učitaj korisnika iz localStorage
  const loadUserFromStorage = useCallback(() => {
    try {
      const userData = localStorage.getItem('bde_current_user');
      const loginTime = localStorage.getItem('bde_login_time');
      
      if (userData && loginTime) {
        const user = JSON.parse(userData);
        const now = Date.now();
        
        // Provjeri da li je sesija validna (7 dana)
        if ((now - parseInt(loginTime)) < 7 * 24 * 60 * 60 * 1000) {
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

  // 1. Provjeri da li vozač postoji po turi
  const checkDriverExists = useCallback(async (tura) => {
    console.log('🚀 checkDriverExists called with tura:', tura);
    setLoading(true);
    setError(null);

    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('id, ime, tura, aktivan, role, password_hash')
        .eq('tura', tura.toUpperCase())
        .eq('aktivan', true)
        .single();

      if (error) {
        console.error('Database error checking driver:', error);
        throw new Error(`Vozač sa turom ${tura} nije pronađen ili nije aktivan`);
      }

      console.log('🔍 Driver check result:', {
        id: driver.id,
        ime: driver.ime,
        tura: driver.tura,
        hasPassword: !!driver.password_hash,
        role: driver.role
      });

      const result = {
        id: driver.id,
        ime: driver.ime,
        tura: driver.tura,
        role: driver.role || 'driver',
        hasPassword: !!driver.password_hash
      };

      console.log('🎯 Returning from checkDriverExists:', result);
      return result;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Postavi početnu lozinku (prvi login)
  const setInitialPassword = useCallback(async (driverId, password) => {
    setLoading(true);
    setError(null);

    try {
      // 🔒 Koristimo SHA-256 za sigurno čuvanje
      const passwordHash = await hashPassword(password);

      const { error } = await supabase
        .from('drivers')
        .update({ 
          password_hash: passwordHash,
          last_login: new Date()
        })
        .eq('id', driverId);

      if (error) {
        throw new Error('Greška pri postavljanju lozinke');
      }

      // Password set successfully
      return true;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Normalan login sa turom i lozinkom
  const login = useCallback(async (tura, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('tura', tura.toUpperCase())
        .eq('aktivan', true)
        .single();

      if (error) {
        console.error('Database error during login:', error);
        throw new Error(`Vozač sa turom ${tura} nije pronađen ili nije aktivan`);
      }

      // Provjeri da li je lozinka postavljena
      if (!driver.password_hash) {
        throw new Error('Vozač nema postavljenu lozinku. Kontaktirajte administratora.');
      }

      // 🔒 Generišemo hash za poređenje
      const hashedInput = await hashPassword(password);

      // Provjeri lozinku - podržava SHA-256 (novo), Base64 (legacy) i Plain (legacy)
      const isPasswordValid = 
        driver.password_hash === hashedInput ||        // SHA-256 (Najsigurnije)
        driver.password_hash === btoa(password) ||     // Base64 encoding (Legacy)
        driver.password_hash === password;             // Plain text (Legacy)
        
      if (!isPasswordValid) {
        throw new Error('Neispravna lozinka');
      }

      // 🔄 Automatska migracija na SHA-256 ako je korišten legacy format
      if (driver.password_hash !== hashedInput) {
        console.log('🚀 Migrating password to SHA-256...');
        await supabase
          .from('drivers')
          .update({ password_hash: hashedInput })
          .eq('id', driver.id);
      }

      // Ažuriraj last_login
      await supabase
        .from('drivers')
        .update({ last_login: new Date() })
        .eq('id', driver.id);

      const user = {
        id: driver.id,
        username: driver.tura,
        name: driver.ime,
        role: driver.role || 'driver',
        loginTime: Date.now()
      };

      console.log('✅ [useSimpleAuth] Setting currentUser:', user);
      setCurrentUser(user);
      saveUserToStorage(user);

      return user;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [saveUserToStorage]);

  // 4. Promjena lozinke
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    if (!currentUser) {
      throw new Error('Morate biti ulogovani');
    }

    setLoading(true);
    setError(null);

    try {
      // Prvo provjeri staru lozinku
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('password_hash')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        throw new Error('Greška pri provjeri korisnika');
      }

      const hashedOld = await hashPassword(oldPassword);

      // Provjeri staru lozinku - podržava sve formate
      const isOldPasswordValid = 
        driver.password_hash === hashedOld ||
        driver.password_hash === oldPassword ||
        driver.password_hash === btoa(oldPassword);
        
      if (!isOldPasswordValid) {
        throw new Error('Stara lozinka nije ispravna');
      }

      // Postavi novu lozinku (uvijek SHA-256)
      const newHash = await hashPassword(newPassword);
      const { error: updateError } = await supabase
        .from('drivers')
        .update({ password_hash: newHash })
        .eq('id', currentUser.id);

      if (updateError) {
        throw new Error('Greška pri ažuriranju lozinke');
      }

      // Password changed successfully
      return true;

    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 5. Logout
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out of Supabase:', e);
    }
    
    setCurrentUser(null);
    localStorage.removeItem('bde_current_user');
    localStorage.removeItem('bde_login_time');
    localStorage.removeItem('DRIVER_NAME'); // Dodatno čišćenje
    setError(null);
    console.log('✅ User logged out');
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const user = loadUserFromStorage();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, [loadUserFromStorage]);

  return {
    currentUser,
    loading,
    error,
    checkDriverExists,
    setInitialPassword,
    login,
    changePassword,
    logout,
    isAuthenticated: !!currentUser
  };
}