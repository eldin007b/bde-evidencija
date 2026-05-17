/**
 * 🔄 Real-time Service
 * Sluša promene u Supabase i ažurira cache instantno
 */
import { supabase } from '../db/supabaseClient';
import { invalidateQueries } from '../lib/queryClient';

class RealtimeService {
  constructor() {
    this.channels = [];
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    
    console.log('🔄 Starting realtime service...');
    
    // Listen za extra rides
    const extraRidesChannel = supabase
      .channel('realtime_extra_rides')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'extra_rides_pending' 
        }, 
        (payload) => {
          console.log('🚗 Extra rides update:', payload.eventType);
          invalidateQueries.extraRides();
        }
      )
      .subscribe();

    // Listen za deliveries
    const deliveriesChannel = supabase
      .channel('realtime_deliveries')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'deliveries' 
        }, 
        (payload) => {
          console.log('📦 Deliveries update:', payload.eventType);
          invalidateQueries.deliveries();
          invalidateQueries.driverStats();
        }
      )
      .subscribe();

    // Listen za drivers
    const driversChannel = supabase
      .channel('realtime_drivers')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'drivers' 
        }, 
        (payload) => {
          console.log('👤 Drivers update:', payload.eventType, payload.new);
          // Eksplicitna invalidacija za React Query
          queryClient.invalidateQueries({ queryKey: queryKeys.drivers.all });
          
          // Emituj event za force logout logiku
          window.dispatchEvent(new CustomEvent('driver_updated', { detail: payload.new }));
        }
      )
      .subscribe();

    this.channels = [extraRidesChannel, deliveriesChannel, driversChannel];
    this.isActive = true;
    
    console.log('✅ Realtime service started - listening for changes');
  }

  stop() {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping realtime service...');
    
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    
    this.channels = [];
    this.isActive = false;
    
    console.log('✅ Realtime service stopped');
  }

  /**
   * Manual trigger kad korisnik doda podatke
   * Ovo forsira instant cache refresh
   */
  triggerDataChange(dataType) {
    console.log(`🔄 Manual trigger for ${dataType}`);
    
    switch (dataType) {
      case 'extraRides':
        invalidateQueries.extraRides();
        invalidateQueries.driverStats();
        break;
      case 'deliveries':
        invalidateQueries.deliveries();
        invalidateQueries.driverStats();
        break;
      case 'drivers':
        invalidateQueries.drivers();
        break;
      default:
        invalidateQueries.all();
    }
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;