import React, { useState, useEffect } from 'react';
import { supabase } from '../../db/supabaseClient';
import { format } from 'date-fns';
import './ExtraRidesApprovalTab.css';

export default function ExtraRidesApprovalTab() {
  const [pendingRides, setPendingRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [filter, setFilter] = useState('pending');

  // Fetch pending extra rides
  const fetchPendingRides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingRides(data || []);
    } catch (error) {
      console.error('Error fetching pending rides:', error);
      setPendingRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRides();
  }, [filter]);

  // Approve ride
  const handleApprove = async (ride) => {
    const rideId = ride.id;
    setProcessing(prev => ({ ...prev, [rideId]: 'approving' }));
    
    try {
      // Insert into approved table
      const { error: insertError } = await supabase
        .from('extra_rides')
        .insert([{
          date: ride.date,
          driver: ride.driver,
          tura: ride.tura,
          plz: ride.plz,
          broj_adresa: ride.broj_adresa,
          cijena: ride.cijena,
          plz_price: ride.plz_price,
          adresa_price: ride.adresa_price,
          created_by: ride.created_by,
          approved_by: 'admin', // You can get this from auth context
          approved_at: new Date().toISOString(),
          status: 'approved',
          original_id: ride.id
        }]);

      if (insertError) throw insertError;

      // Update pending status
      const { error: updateError } = await supabase
        .from('extra_rides_pending')
        .update({ 
          status: 'approved',
          approved_by: 'admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (updateError) throw updateError;

      // Refresh list
      fetchPendingRides();
      alert('Vožnja je uspješno odobrena!');
    } catch (error) {
      console.error('Error approving ride:', error);
      alert('Greška pri odobravanju vožnje: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [rideId]: null }));
    }
  };

  // Reject ride
  const handleReject = async (ride) => {
    if (!confirm('Da li ste sigurni da želite odbaciti ovu vožnju?')) return;
    
    const rideId = ride.id;
    setProcessing(prev => ({ ...prev, [rideId]: 'rejecting' }));
    
    try {
      const { error } = await supabase
        .from('extra_rides_pending')
        .update({ 
          status: 'rejected',
          approved_by: 'admin',
          approved_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (error) throw error;

      fetchPendingRides();
      alert('Vožnja je odbačena!');
    } catch (error) {
      console.error('Error rejecting ride:', error);
      alert('Greška pri odbacivanju vožnje: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [rideId]: null }));
    }
  };

  // Delete ride permanently
  const handleDelete = async (ride) => {
    if (!confirm('Da li ste sigurni da želite trajno obrisati ovu vožnju?')) return;
    
    const rideId = ride.id;
    setProcessing(prev => ({ ...prev, [rideId]: 'deleting' }));
    
    try {
      const { error } = await supabase
        .from('extra_rides_pending')
        .delete()
        .eq('id', rideId);

      if (error) throw error;

      fetchPendingRides();
      alert('Vožnja je trajno obrisana!');
    } catch (error) {
      console.error('Error deleting ride:', error);
      alert('Greška pri brisanju vožnje: ' + error.message);
    } finally {
      setProcessing(prev => ({ ...prev, [rideId]: null }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFC107';
      case 'approved': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ Na čekanju';
      case 'approved': return '✅ Odobreno';
      case 'rejected': return '❌ Odbačeno';
      default: return status;
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '15px',
      padding: '25px',
      margin: '20px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#2c3e50',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          🛻 Upravljanje ekstra vožnjama
        </h2>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '10px 15px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            background: 'white',
            fontSize: '14px'
          }}
        >
          <option value="pending">Na čekanju</option>
          <option value="approved">Odobreno</option>
          <option value="rejected">Odbačeno</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Učitavanje...</div>
        </div>
      ) : pendingRides.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Nema vožnji sa statusom "{getStatusText(filter).replace(/[⏳✅❌] /, '')}"
          </div>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Datum</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vozač</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Tura</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>PLZ</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Broj adr.</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Cijena</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Kreiran</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {pendingRides.map((ride) => (
                <tr key={ride.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px 15px' }}>
                    {format(new Date(ride.date), 'dd.MM.yyyy')}
                  </td>
                  <td style={{ padding: '12px 15px' }}>{ride.driver}</td>
                  <td style={{ padding: '12px 15px' }}>{ride.tura}</td>
                  <td style={{ padding: '12px 15px' }}>{ride.plz}</td>
                  <td style={{ padding: '12px 15px' }}>{ride.broj_adresa}</td>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>
                    {ride.cijena?.toFixed(2)}€
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: getStatusColor(ride.status),
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {getStatusText(ride.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', fontSize: '12px', color: '#666' }}>
                    {format(new Date(ride.created_at), 'dd.MM.yyyy HH:mm')}
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {ride.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(ride)}
                            disabled={processing[ride.id]}
                            style={{
                              background: processing[ride.id] === 'approving' ? '#ccc' : '#28A745',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: processing[ride.id] ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            {processing[ride.id] === 'approving' ? '...' : '✅ Odobri'}
                          </button>
                          <button
                            onClick={() => handleReject(ride)}
                            disabled={processing[ride.id]}
                            style={{
                              background: processing[ride.id] === 'rejecting' ? '#ccc' : '#DC3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: processing[ride.id] ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            {processing[ride.id] === 'rejecting' ? '...' : '❌ Odbaci'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(ride)}
                        disabled={processing[ride.id]}
                        style={{
                          background: processing[ride.id] === 'deleting' ? '#ccc' : '#6C757D',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: processing[ride.id] ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {processing[ride.id] === 'deleting' ? '...' : '🗑️ Obriši'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}