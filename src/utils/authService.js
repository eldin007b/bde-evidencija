import { supabase } from '../db/supabaseClient';

// Improved Auth Service using Supabase
class AuthService {
  constructor() {
    this.currentUser = this.loadUserFromStorage();
  }

  // Učitaj korisnika iz localStorage
  loadUserFromStorage() {
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
          this.logout();
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
    return null;
  }

  // Sačuvaj korisnika u localStorage
  saveUserToStorage(user) {
    try {
      localStorage.setItem('bde_current_user', JSON.stringify(user));
      localStorage.setItem('bde_login_time', Date.now().toString());
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  // Autentifikacija korisnika
  async authenticate(username, password) {
    try {
      // Specijalan slučaj: 19102420/19102420 loguje Eldin-a (8610) sa admin privilegijama
      if (username === '19102420' && password === '19102420') {
        // Pronađi Eldin-a u bazi
        const { data: eldinUser, error: eldinError } = await supabase
          .from('app_users')
          .select('*')
          .eq('tura', '8610')
          .eq('active', true)
          .limit(1);

        if (eldinError) {
          throw eldinError;
        }

        if (eldinUser && eldinUser.length > 0) {
          const user = eldinUser[0];
          const authenticatedUser = {
            id: user.id,
            username: user.tura,
            name: user.ime,
            role: 'admin', // Daj admin ulogu za ovaj login
            loginTime: Date.now(),
            isAdminLogin: true // Flag da je ovo admin login
          };

          this.currentUser = authenticatedUser;
          this.saveUserToStorage(authenticatedUser);
          
          return authenticatedUser;
        } else {
          throw new Error('Eldin (8610) nije pronađen u bazi');
        }
      }

      // Normalan login - pozovi Supabase da pronađe korisnika
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tura', username)
        .eq('active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      if (users && users.length > 0) {
        const user = users[0];
        
        // Provjeri lozinku (za sada jednostavna provjera, kasnije možeš dodati hash)
        if (user.password_hash === password) {
          const authenticatedUser = {
            id: user.id,
            username: user.tura,
            name: user.ime,
            role: user.role,
            loginTime: Date.now()
          };

          this.currentUser = authenticatedUser;
          this.saveUserToStorage(authenticatedUser);
          
          return authenticatedUser;
        } else {
          throw new Error('Neispravna lozinka');
        }
      } else {
        throw new Error('Korisnik nije pronađen ili nije aktivan');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  // Dobij sve aktivne vozače iz baze
  async getActiveDrivers() {
    try {
      const { data: drivers, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('active', true)
        .eq('role', 'driver')
        .order('tura');

      if (error) {
        throw error;
      }

      // Konvertuj format za kompatibilnost sa postojećim kodom
      return drivers.map(driver => ({
        id: driver.id,
        tura: driver.tura,
        ime: driver.ime,
        name: driver.ime, // fallback
        tour: driver.tura, // fallback
        role: driver.role
      }));
    } catch (error) {
      console.error('Error loading drivers:', error);
      return [];
    }
  }

  // Dobij korisnika po turi
  async getUserByTura(tura) {
    try {
      const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('tura', tura)
        .eq('active', true)
        .limit(1);

      if (error) {
        throw error;
      }

      if (users && users.length > 0) {
        const user = users[0];
        return {
          id: user.id,
          tura: user.tura,
          ime: user.ime,
          name: user.ime,
          tour: user.tura,
          role: user.role
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading user by tura:', error);
      return null;
    }
  }

  // Trenutni korisnik
  getCurrentUser() {
    return this.currentUser;
  }

  // Provjeri da li je korisnik autentifikovan
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Provjeri da li je korisnik admin
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  // Provjeri da li je korisnik vozač
  isDriver() {
    return this.currentUser && this.currentUser.role === 'driver';
  }

  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem('bde_current_user');
    localStorage.removeItem('bde_login_time');
  }

  // Promijeni lozinku (za buduće proširenje)
  async changePassword(oldPassword, newPassword) {
    if (!this.currentUser) {
      throw new Error('Korisnik nije ulogovan');
    }

    try {
      // Prvo provjeri staru lozinku
      const { data: users, error: fetchError } = await supabase
        .from('app_users')
        .select('password_hash')
        .eq('tura', this.currentUser.username)
        .limit(1);

      if (fetchError) throw fetchError;

      if (!users || users.length === 0 || users[0].password_hash !== oldPassword) {
        throw new Error('Stara lozinka nije ispravna');
      }

      // Ažuriraj lozinku
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ password_hash: newPassword })
        .eq('tura', this.currentUser.username);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
}

// Kreiraj i eksportuj instancu
const authService = new AuthService();
export default authService;