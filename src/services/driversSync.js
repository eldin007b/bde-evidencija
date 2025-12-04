import { supabase } from '../db/supabaseClient';

/**
 * Service za sinhronizaciju između app_users (auth) i drivers (business) tabela
 * 
 * app_users: tura, ime, password_hash, role, active, last_login, device_id
 * drivers: tura, ime, aktivan, target_per_day, device_id, role, last_updated
 */
class DriversSync {
  constructor() {
    // track per-user sync in progress to allow parallel bulk syncs
    // (previously a single boolean blocked concurrent syncUserToDriver calls)
    this.syncInProgress = new Set();
  }

  /**
   * Sinhronizuje osnovne podatke iz app_users u drivers tabelu
   * Poziva se pri login-u ili promjeni podataka
   */
  async syncUserToDriver(userTura) {
    // avoid duplicate concurrent sync for the same tura
    if (this.syncInProgress.has(userTura)) {
      console.log(`Skipping sync for ${userTura} - already in progress`);
      return false;
    }

    this.syncInProgress.add(userTura);
    try {
      
      // Uzmi korisnika iz app_users

      // fetch auth user - should exist for active users
      // NOTE: some schemas may not have `device_id` column; select only stable fields
      const { data: user, error: userError } = await supabase
        .from('app_users')
        .select('tura, ime, role, active, last_login')
        .eq('tura', userTura)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return false;
      }

      if (!user) {
        console.warn(`User ${userTura} not found in app_users`);
        return false;
      }

      // Provjeri da li postoji u drivers tabeli
      // use maybeSingle to avoid PostgREST "no rows" error when driver missing
      const { data: existingDriver, error: driverError } = await supabase
        .from('drivers')
        .select('id, tura, ime, aktivan, target_per_day')
        .eq('tura', userTura)
        .eq('deleted', 0)
        .maybeSingle();

      if (driverError) {
        console.error('Error checking driver:', driverError);
        return false;
      }

      const syncData = {
        tura: user.tura,
        ime: user.ime,
        aktivan: user.active,
        role: user.role,
        last_login: user.last_login,
        last_updated: new Date()
      };

      // only include device_id if present in the auth record (avoid writing undefined)
      if (user && user.device_id !== undefined) {
        syncData.device_id = user.device_id;
      }

      if (existingDriver) {
        // Ažuriraj postojećeg vozača (zadrži target_per_day)
        const { error: updateError } = await supabase
          .from('drivers')
          .update(syncData)
          .eq('id', existingDriver.id);

        if (updateError) {
          console.error('Error updating driver:', updateError);
          return false;
        }

        console.log(`Synced user ${userTura} to existing driver record`);
      } else {
        // Kreiraj novog vozača
        const newDriverData = {
          ...syncData,
          target_per_day: 0, // default target
          deleted: 0
        };

        const { error: insertError } = await supabase
          .from('drivers')
          .insert([newDriverData]);

        if (insertError) {
          console.error('Error creating driver:', insertError);
          return false;
        }

        console.log(`Created new driver record for user ${userTura}`);
      }

      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    } finally {
      // release per-user lock
      this.syncInProgress.delete(userTura);
    }
  }

  /**
   * Sinhronizuje promjene iz drivers u app_users (ime, role)
   */
  async syncDriverToUser(driverTura, updates) {
    try {
      const syncableFields = {};
      
      // Samo određena polja se mogu sinhronizovati nazad
      if (updates.ime) syncableFields.ime = updates.ime;
      if (updates.role) syncableFields.role = updates.role;
      if (updates.aktivan !== undefined) syncableFields.active = updates.aktivan;
      if (updates.device_id !== undefined) syncableFields.device_id = updates.device_id;

      if (Object.keys(syncableFields).length === 0) {
        return true; // Nema šta da se sinhronizuje
      }

      syncableFields.updated_at = new Date();

      const { error } = await supabase
        .from('app_users')
        .update(syncableFields)
        .eq('tura', driverTura);

      if (error) {
        console.error('Error syncing driver to user:', error);
        return false;
      }

      console.log(`Synced driver ${driverTura} changes back to app_users`);
      return true;
    } catch (error) {
      console.error('Sync driver to user error:', error);
      return false;
    }
  }

  /**
   * Sinhronizuje sve aktivne korisnike iz app_users u drivers
   * Koristi se za početnu sinhronizaciju ili mass sync
   */
  async syncAllUsers() {
    try {
      const { data: users, error } = await supabase
        .from('app_users')
        .select('tura')
        .eq('active', true);

      if (error) {
        console.error('Error fetching all users:', error);
        return false;
      }

      // Run syncs in parallel (per-user locking inside syncUserToDriver prevents duplicates)
      const syncPromises = users.map(user => this.syncUserToDriver(user.tura));
      const results = await Promise.allSettled(syncPromises);

      const detailed = results.map((r, idx) => ({
        tura: users[idx]?.tura,
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : undefined,
        reason: r.status === 'rejected' ? (r.reason && r.reason.message) || r.reason : undefined
      }));

      const successful = detailed.filter(d => d.status === 'fulfilled' && d.value).length;
      const total = detailed.length;

      console.log('Bulk sync detailed results:', detailed);
      console.log(`Bulk sync completed: ${successful}/${total} users synced`);
      return { successful, total, success: successful === total, details: detailed };
    } catch (error) {
      console.error('Bulk sync error:', error);
      return false;
    }
  }

  /**
   * Vraća kombinovane podatke za korisnika (auth + business)
   */
  async getCombinedUserData(userTura) {
    try {
      const [authResult, businessResult] = await Promise.all([
        supabase
          .from('app_users')
          .select('*')
          .eq('tura', userTura)
          .single(),
        supabase
          .from('drivers')
          .select('*')
          .eq('tura', userTura)
          .eq('deleted', 0)
          .single()
      ]);

      const authData = authResult.data;
      const businessData = businessResult.data;

      if (!authData) {
        console.warn(`No auth data found for ${userTura}`);
        return null;
      }

      // Kombiniraj podatke
      return {
        // Auth podaci (primary)
        id: authData.id,
        tura: authData.tura,
        ime: authData.ime,
        role: authData.role,
        active: authData.active,
        password_hash: authData.password_hash,
        device_id: authData.device_id,
        last_login: authData.last_login,
        
        // Business podaci (secondary)
        businessId: businessData?.id,
        aktivan: businessData?.aktivan ?? authData.active,
        target_per_day: businessData?.target_per_day ?? 0,
        last_updated: businessData?.last_updated,
        
        // Meta
        hasBusiness: !!businessData,
        syncNeeded: authData.active !== businessData?.aktivan
      };
    } catch (error) {
      console.error('Error getting combined data:', error);
      return null;
    }
  }
}

// Singleton instance
const driversSync = new DriversSync();
export default driversSync;