import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../db/supabaseClient';
import { format } from 'date-fns';
import ActionButton from '../common/ActionButton';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import ModernModal from './ModernModal';

const RidesTab = () => {
  const [pendingRides, setPendingRides] = useState([]);
  const [approvedRides, setApprovedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRide, setEditingRide] = useState(null);
  const [editForm, setEditForm] = useState({
    driver: '',
    date: '',
    tura: '',
    plz: '',
    broj_adresa: '',
    cijena: '',
    notes: ''
  });
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const isTablet = window.innerWidth > 700;

  // Funkcija za učitavanje vožnji iz Supabase
  const fetchRides = useCallback(async () => {
    setLoading(true);
    
    try {
      const [year, month] = filterMonth.split('-');
      
      // Koristi tačan datum opseg
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');
      
      console.log('📅 [RidesTab] Date range:', from, 'to', to);
      
      // Fetch approved extra rides from extra_rides table
      const { data: approvedData, error: approvedError } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      // Fetch pending extra rides from extra_rides_pending table
      const { data: pendingData, error: pendingError } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'pending')
        .order('date', { ascending: false });

      if (approvedError) {
        console.error('Error fetching approved rides:', approvedError);
      }
      if (pendingError) {
        console.error('❌ [RidesTab] Error fetching pending rides:', pendingError);
      }

      // Mapiranje podataka iz baze u format koji komponenta očekuje
      const mappedPending = (pendingData || []).map(ride => ({
        id: ride.id,
        vozac: ride.driver,
        datum: format(new Date(ride.date), 'dd.MM.yyyy'),
        tura: ride.tura,
        plz: ride.plz,
        brojAdresa: ride.broj_adresa,
        cijena: `${ride.cijena}€`,
        status: ride.status,
        napomena: ride.notes || ''
      }));

      const mappedApproved = (approvedData || []).map(ride => ({
        id: ride.id,
        vozac: ride.driver,
        datum: format(new Date(ride.date), 'dd.MM.yyyy'),
        tura: ride.tura,
        plz: ride.plz,
        brojAdresa: ride.broj_adresa,
        cijena: `${ride.cijena}€`,
        status: 'approved',
        napomena: ride.notes || ''
      }));

      setPendingRides(mappedPending);
      setApprovedRides(mappedApproved);

    } catch (error) {
      console.error('❌ [RidesTab] Error fetching rides:', error);
      setPendingRides([]);
      setApprovedRides([]);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Funkcija za odobravanje vožnje
  const approveRide = async (rideId) => {
    try {
      // Pronađi vožnju u pending listi
      const ride = pendingRides.find(r => r.id === rideId);
      if (!ride) return;

      // Učitaj originalne podatke iz pending tabele
      const { data: originalRide, error: fetchError } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .eq('id', rideId)
        .single();

      if (fetchError) throw fetchError;

      // Pomeri iz pending u approved tabelu sa svim potrebnim poljima
      const { error: insertError } = await supabase
        .from('extra_rides')
        .insert([{
          date: originalRide.date,
          driver: originalRide.driver,
          tura: originalRide.tura,
          plz: originalRide.plz,
          broj_adresa: originalRide.broj_adresa,
          cijena: originalRide.cijena,
          notes: originalRide.notes,
          plz_price: originalRide.plz_price,
          adresa_price: originalRide.adresa_price,
          created_by: originalRide.created_by,
          status: 'approved',
          approved_by: 'Admin',
          approved_at: new Date().toISOString(),
          original_id: originalRide.original_id
        }]);

      if (insertError) throw insertError;

      // Ukloni iz pending tabele
      const { error: deleteError } = await supabase
        .from('extra_rides_pending')
        .delete()
        .eq('id', rideId);

      if (deleteError) throw deleteError;

      // Refresh podatke
      await fetchRides();
      
      alert('Vožnja je uspešno odobrena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error approving ride:', error);
      alert('Greška pri odobravanju vožnje: ' + error.message);
    }
  };

  // Funkcija za odbijanje vožnje
  const rejectRide = async (rideId) => {
    try {
      // Označi kao odbačenu
      const { error } = await supabase
        .from('extra_rides_pending')
        .update({ status: 'rejected' })
        .eq('id', rideId);

      if (error) throw error;

      // Refresh podatke
      await fetchRides();
      
      alert('Vožnja je odbijena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error rejecting ride:', error);
      alert('Greška pri odbijanju vožnje: ' + error.message);
    }
  };

  // Funkcija za otvaranje edit modala
  const openEditModal = (ride, isPending = true) => {
    console.log('📝 [RidesTab] Opening edit modal for ride:', ride);
    
    setEditingRide({ ...ride, isPending });
    setEditForm({
      driver: ride.vozac,
      date: ride.datum.split('.').reverse().join('-'), // DD.MM.YYYY -> YYYY-MM-DD
      tura: ride.tura,
      plz: ride.plz,
      broj_adresa: ride.brojAdresa,
      cijena: parseFloat(ride.cijena.replace('€', '')),
      notes: ride.napomena || ''
    });
    setEditModalVisible(true);
  };

  // Funkcija za čuvanje izmena
  const saveRideEdit = async () => {
    if (!editingRide) return;
    
    try {
      console.log('💾 [RidesTab] Saving ride edit:', editForm);
      
      const updateData = {
        driver: editForm.driver,
        date: editForm.date,
        tura: editForm.tura,
        plz: editForm.plz,
        broj_adresa: parseInt(editForm.broj_adresa),
        cijena: parseFloat(editForm.cijena),
        notes: editForm.notes,
        last_updated: new Date().toISOString()
      };

      const tableName = editingRide.isPending ? 'extra_rides_pending' : 'extra_rides';
      
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', editingRide.id);

      if (error) throw error;

      // Zatври modal i refresh podatke
      setEditModalVisible(false);
      setEditingRide(null);
      await fetchRides();
      
      alert('Vožnja je uspešno izmenjena!');
    } catch (error) {
      console.error('❌ [RidesTab] Error saving ride edit:', error);
      alert('Greška pri čuvanju izmena: ' + error.message);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.04) 100%)',
      backdropFilter: 'blur(15px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      padding: '2rem',
      color: 'var(--text-on-dark, #f1f5f9)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 'bold', margin: 0, color: 'var(--text-on-dark, #f1f5f9)' }}>🚚 Extra vožnje - Odobravanje</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 14, color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8 }}>Mesec:</label>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-on-dark, #f1f5f9)',
              backdropFilter: 'blur(5px)'
            }}
          />
        </div>
      </div>
      
      {/* Statistika */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ 
          background: 'rgba(255, 193, 7, 0.15)', 
          borderRadius: 16, 
          padding: 16, 
          flex: 1, 
          border: '1px solid rgba(255, 193, 7, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>⏳ Pending: {pendingRides.length}</span>
        </div>
        <div style={{ 
          background: 'rgba(40, 167, 69, 0.15)', 
          borderRadius: 16, 
          padding: 16, 
          flex: 1, 
          border: '1px solid rgba(40, 167, 69, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Odobreno: {approvedRides.length}</span>
        </div>
      </div>

      {/* Pending vožnje */}
      <h3 style={{ marginBottom: 10, color: 'var(--text-on-dark, #f1f5f9)' }}>⏳ Vožnje na čekanju</h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>🔄 Učitavanje...</div>
        </div>
      ) : pendingRides.length === 0 ? (
        <EmptyState icon={<span>✅</span>} text="Nema vožnji na čekanju" subtext="Sve vožnje su obrađene." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 24 }}>
          {pendingRides.map(ride => (
            <div key={ride.id} style={{ 
              background: 'rgba(255, 193, 7, 0.1)', 
              borderRadius: 12, 
              padding: 14, 
              border: '1px solid rgba(255, 193, 7, 0.3)',
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--text-on-dark, #f1f5f9)' }}>👤 {ride.vozac}</span>
                <StatusBadge status={ride.status}>⏳ {ride.status}</StatusBadge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>📅 Datum: <strong>{ride.datum}</strong></div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>🚛 Tura: <strong>{ride.tura}</strong></div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>📍 PLZ: <strong>{ride.plz}</strong></div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>🏠 Adrese: <strong>{ride.brojAdresa}</strong></div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>💰 Cijena: <strong>{ride.cijena}</strong></div>
              </div>
              <div style={{ display: 'flex', marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
                <ActionButton onClick={() => approveRide(ride.id)} bgColor="#28a745">✅ Odobri</ActionButton>
                <ActionButton onClick={() => rejectRide(ride.id)} bgColor="#dc3545">❌ Odbij</ActionButton>
                <ActionButton onClick={() => openEditModal(ride, true)} bgColor="#ffc107">✏️ Uredi</ActionButton>
                <ActionButton onClick={() => { setSelectedRide(ride); setModalVisible(true); }} bgColor="#007bff">📋 Detalji</ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Odobrene vožnje */}
      <h3 style={{ marginTop: 24, marginBottom: 10, color: 'var(--text-on-dark, #f1f5f9)' }}>✅ Odobrene vožnje</h3>
      {approvedRides.length === 0 ? (
        <EmptyState icon={<span>📋</span>} text="Nema odobrenih vožnji" subtext="Za odabrani mesec." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isTablet ? 2 : 1}, 1fr)`, gap: 12 }}>
          {approvedRides.map(ride => (
            <div key={ride.id} style={{ 
              background: 'rgba(40, 167, 69, 0.1)', 
              borderRadius: 12, 
              padding: 14, 
              border: '1px solid rgba(40, 167, 69, 0.3)',
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--text-on-dark, #f1f5f9)' }}>👤 {ride.vozac}</span>
                <StatusBadge status="approved">✅ Odobreno</StatusBadge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6, marginBottom: 12 }}>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>📅 {ride.datum}</div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>🚛 {ride.tura}</div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>📍 {ride.plz}</div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>🏠 {ride.brojAdresa}</div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>💰 {ride.cijena}</div>
              </div>
              <div style={{ display: 'flex', marginTop: 10, gap: 8 }}>
                <ActionButton onClick={() => openEditModal(ride, false)} bgColor="#ffc107">✏️ Uredi</ActionButton>
                <ActionButton onClick={() => { setSelectedRide(ride); setModalVisible(true); }} bgColor="#007bff">📋 Detalji</ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Detalji Modal */}
      <ModernModal 
        open={modalVisible} 
        title="📋 Detalji vožnje" 
        onClose={() => setModalVisible(false)} 
        showActions={false}
      >
        {selectedRide && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'auto 1fr', 
              gap: '12px',
              alignItems: 'center'
            }}>
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>👤 Vozač:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.vozac}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>📅 Datum:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.datum}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>🚛 Tura:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.tura}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>📍 PLZ:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.plz}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>🏠 Broj adresa:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.brojAdresa}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>💰 Cijena:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.cijena}</span>
              
              <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>📊 Status:</strong> 
              <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.status}</span>
              
              {selectedRide.napomena && (
                <>
                  <strong style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>📝 Napomena:</strong> 
                  <span style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.9 }}>{selectedRide.napomena}</span>
                </>
              )}
            </div>
          </div>
        )}
      </ModernModal>

      {/* Edit Modal */}
      <ModernModal 
        open={editModalVisible} 
        title={`✏️ Uredi vožnju ${editingRide?.isPending ? '(Pending)' : '(Odobreno)'}`}
        onClose={() => setEditModalVisible(false)} 
        onSubmit={saveRideEdit} 
        loading={loading}
        submitLabel="💾 Sačuvaj promjene"
        closeLabel="❌ Otkaži"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>👤 Vozač:</label>
            <input
              type="text"
              value={editForm.driver}
              onChange={(e) => setEditForm({...editForm, driver: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-on-dark, #f1f5f9)',
                backdropFilter: 'blur(5px)'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>📅 Datum:</label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({...editForm, date: e.target.value})}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-on-dark, #f1f5f9)',
                backdropFilter: 'blur(5px)'
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🚛 Tura:</label>
              <input
                type="text"
                value={editForm.tura}
                onChange={(e) => setEditForm({...editForm, tura: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark, #f1f5f9)',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>📍 PLZ:</label>
              <input
                type="text"
                value={editForm.plz}
                onChange={(e) => setEditForm({...editForm, plz: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark, #f1f5f9)',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🏠 Broj adresa:</label>
              <input
                type="number"
                min="1"
                value={editForm.broj_adresa}
                onChange={(e) => setEditForm({...editForm, broj_adresa: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark, #f1f5f9)',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>💰 Cijena (€):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editForm.cijena}
                onChange={(e) => setEditForm({...editForm, cijena: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-on-dark, #f1f5f9)',
                  backdropFilter: 'blur(5px)'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>📝 Napomena:</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text-on-dark, #f1f5f9)',
                backdropFilter: 'blur(5px)'
              }}
              placeholder="Dodajte napomenu..."
            />
          </div>
        </div>
      </ModernModal>
    </div>
  );
};

export default RidesTab;