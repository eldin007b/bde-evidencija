import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/supabaseClient';

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
        
        // Provjeri da li je sesija validna (24h)
        if ((now - parseInt(loginTime)) < 24 * 60 * 60 * 1000) {
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
      // Jednostavno hash-ovanje (u produkciji koristiti bcrypt)
      const passwordHash = btoa(password); // Base64 encoding za test

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

      console.log('🔍 Driver found for login:', {
        tura: driver.tura,
        ime: driver.ime,
        hasPassword: !!driver.password_hash,
        role: driver.role
      });

      // Provjeri da li je lozinka postavljena
      if (!driver.password_hash) {
        throw new Error('Vozač nema postavljenu lozinku. Kontaktirajte administratora.');
      }

      // Provjeri lozinku - podržava i plain text i base64
      const isPasswordValid = 
        driver.password_hash === password ||           // Plain text (postojeći format)
        driver.password_hash === btoa(password);       // Base64 encoded (novi format)
        
      if (!isPasswordValid) {
        // Debug info removed for production
        throw new Error('Neispravna lozinka');
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

      // Provjeri staru lozinku - podržava i plain text i base64
      const isOldPasswordValid = 
        driver.password_hash === oldPassword ||           // Plain text (postojeći format)
        driver.password_hash === btoa(oldPassword);       // Base64 encoded (novi format)
        
      if (!isOldPasswordValid) {
        throw new Error('Stara lozinka nije ispravna');
      }

      // Postavi novu lozinku
      const newHash = btoa(newPassword);
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
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('bde_current_user');
    localStorage.removeItem('bde_login_time');
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