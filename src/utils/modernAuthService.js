// Modern Auth Service koji koristi drivers tabelu
import { supabase } from '../db/supabaseClient';

class ModernAuthService {
  constructor() {
    this.currentUser = this.loadUserFromStorage();
  }

  // Dohvati device ID (simulacija za web)
  getDeviceId() {
    // Za web ćemo koristiti kombinaciju korisničkih parametara
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    const deviceInfo = [
      navigator.userAgent,
      renderer,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Kreiraj kraći hash od device info
    let hash = 0;
    for (let i = 0; i < deviceInfo.length; i++) {
      const char = deviceInfo.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `WEB_${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  // Učitaj korisnika iz localStorage
  loadUserFromStorage() {
    try {
      const userData = localStorage.getItem('bde_driver_session');
      if (userData) {
        const user = JSON.parse(userData);
        // Provjeri da li je sesija još uvijek validna (24h)
        const loginTime = localStorage.getItem('bde_driver_login_time');
        const now = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 sata
        
        if (loginTime && (now - parseInt(loginTime)) < sessionDuration) {
          return user;
        } else {
          this.logout(); // Sesija je istekla
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
    return null;
  }

  // Prijava vozača koristeći tura kod
  async loginDriver(turaCode, password = null) {
    try {
      // Pronađi vozača po tura kodu
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('tura', turaCode)
        .eq('aktivan', true)
        .eq('deleted', 0)
        .single();

      if (error) {
        console.error('Driver lookup error:', error);
        return { success: false, error: 'Vozač sa tim kodom nije pronađen ili nije aktivan' };
      }

      if (!driver) {
        return { success: false, error: 'Vozač sa tim kodom nije pronađen' };
      }

      // Za admin korisnike možda treba password provjera
      if (driver.role === 'admin' && password) {
        // Ovdje možeš dodati password provjeru ako želiš
        // Za sada ću preskočiti password provjeru
      }

      // Ažuriraj last_login i device_id
      const deviceId = this.getDeviceId();
      const loginTime = new Date();

      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          last_login: loginTime,
          device_id: deviceId,
          last_updated: loginTime
        })
        .eq('id', driver.id);

      if (updateError) {
        console.error('Update error:', updateError);
        // Nastavi sa login-om čak i ako update ne uspije
      }

      // Kreiraj user session
      const userSession = {
        id: driver.id,
        ime: driver.ime,
        tura: driver.tura,
        role: driver.role,
        device_id: deviceId,
        target_per_day: driver.target_per_day,
        aktivan: driver.aktivan,
        loginTime: loginTime.getTime(),
        last_login: loginTime.toISOString()
      };

      // Sačuvaj u localStorage
      localStorage.setItem('bde_driver_session', JSON.stringify(userSession));
      localStorage.setItem('bde_driver_login_time', Date.now().toString());
      this.currentUser = userSession;

      return { success: true, user: userSession };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Greška prilikom prijave: ' + error.message };
    }
  }

  // Prijava admin korisnika
  async loginAdmin(username, password) {
    try {
      // Koristi novi useAuth hook preko direktnog import-a
      const { default: useAuthImport } = await import('../hooks/useAuth');
      
      // Za admin login, koristimo posebnu logiku koja već postoji u useAuth
      if (username === '19102420' && password === '19102420') {
        // Import supabase directly for this special case
        const { supabase } = await import('../db/supabaseClient');
        
        // Pronađi Eldin-a u bazi
        const { data: eldinUser, error: eldinError } = await supabase
          .from('app_users')
          .select('*')
          .eq('tura', '8610')
          .eq('active', true)
          .single();

        if (eldinError || !eldinUser) {
          return { success: false, error: 'Eldin (8610) nije pronađen u bazi' };
        }

        const userSession = {
          id: eldinUser.id,
          ime: eldinUser.ime,
          tura: eldinUser.tura,
          role: 'admin',
          device_id: eldinUser.device_id,
          target_per_day: 0,
          aktivan: true,
          loginTime: Date.now(),
          last_login: new Date().toISOString(),
          isSystemAdmin: true,
          isAdminLogin: true
        };
        
        localStorage.setItem('bde_driver_session', JSON.stringify(userSession));
        localStorage.setItem('bde_driver_login_time', Date.now().toString());
        localStorage.setItem('bde_current_user', JSON.stringify(userSession));
        localStorage.setItem('bde_login_time', Date.now().toString());
        this.currentUser = userSession;
        
        return { success: true, user: userSession };
      } else {
        return { success: false, error: 'Neispravno korisničko ime ili lozinka' };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Greška prilikom prijave: ' + error.message };
    }
  }

  // Odjava korisnika
  logout() {
    localStorage.removeItem('bde_driver_session');
    localStorage.removeItem('bde_driver_login_time');
    this.currentUser = null;
  }

  // Provjeri da li je korisnik prijavljen
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Provjeri da li je korisnik admin
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  // Dobij trenutnog korisnika
  getCurrentUser() {
    return this.currentUser;
  }

  // Dobij login informacije za prikaz
  getLoginInfo() {
    if (!this.currentUser) return null;

    return {
      ime: this.currentUser.ime,
      tura: this.currentUser.tura,
      role: this.currentUser.role,
      device_id: this.currentUser.device_id,
      last_login: this.currentUser.last_login,
      target_per_day: this.currentUser.target_per_day
    };
  }

  // Provjeri autentifikaciju za admin panel
  requireAuth() {
    if (!this.isAuthenticated() || !this.isAdmin()) {
      return false;
    }
    return true;
  }

  // Refresh user podataka iz baze
  async refreshUserData() {
    if (!this.currentUser || this.currentUser.isSystemAdmin) return;

    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', this.currentUser.id)
        .single();

      if (!error && driver) {
        this.currentUser = {
          ...this.currentUser,
          ime: driver.ime,
          tura: driver.tura,
          role: driver.role,
          target_per_day: driver.target_per_day,
          aktivan: driver.aktivan
        };
        
        localStorage.setItem('bde_driver_session', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }

  // Ažuriraj aktivnost korisnika (heartbeat)
  async updateActivity() {
    if (!this.currentUser || this.currentUser.isSystemAdmin) return;

    try {
      console.log('💓 [Activity] Updating activity for user:', this.currentUser.ime);
      
      const now = new Date();
      
      const { error } = await supabase
        .from('drivers')
        .update({
          last_login: now.toISOString(),
          last_updated: now.toISOString()
        })
        .eq('id', this.currentUser.id);

      if (error) {
        console.error('❌ [Activity] Error updating activity:', error);
      } else {
        console.log('✅ [Activity] Activity updated successfully');
        
        // Ažuriraj i localStorage session
        this.currentUser.last_login = now.toISOString();
        localStorage.setItem('bde_driver_session', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('❌ [Activity] Error in updateActivity:', error);
    }
  }
}

// Eksportuj singleton instancu
const modernAuthService = new ModernAuthService();
export default modernAuthService;