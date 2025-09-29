import React, { useState } from 'react';
import ActionButton from '../../components/common/ActionButton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ModalForm from '../../components/common/ModalForm';
import useRidesApproval from '../../hooks/useRidesApproval';
import './RidesApprovalTab.css';

const RidesApprovalTab = () => {
  const { 
    pendingRides, 
    loading, 
    approveRide, 
    rejectRide, 
    fetchPendingRides,
    error 
  } = useRidesApproval();
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (rideId) => {
    setActionLoading(true);
    try {
      await approveRide(rideId);
    } catch (error) {
      console.error('Greška pri odobravanju vožnje:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (rideId) => {
    setActionLoading(true);
    try {
      await rejectRide(rideId);
    } catch (error) {
      console.error('Greška pri odbijanju vožnje:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="rides-approval-container">
      <div className="rides-approval-header">
        <h2>Zahtjevi za vožnje</h2>
        <ActionButton 
          onClick={fetchPendingRides} 
          bgColor="#007bff"
          disabled={loading}
        >
          🔄 Refresh
        </ActionButton>
      </div>

      {error && (
        <div className="error-message">
          Greška: {error.message}
        </div>
      )}
      
      {loading ? (
        <div className="loading-state">Učitavanje...</div>
      ) : pendingRides.length === 0 ? (
        <EmptyState 
          icon={<span>🚗</span>} 
          text="Nema pending vožnji" 
          subtext="Sve vožnje su odobrene." 
        />
      ) : (
        <div className="rides-grid">
          {pendingRides.map(ride => (
            <div key={ride.id} className="ride-card pending">
              <div className="ride-header">
                <span className="driver-name">{ride.vozac}</span>
                <StatusBadge status={ride.status}>{ride.status}</StatusBadge>
              </div>
              
              <div className="ride-details">
                <div className="detail-item">📅 Datum: {ride.datum}</div>
                <div className="detail-item">🚌 Tura: {ride.tura}</div>
                <div className="detail-item">📍 PLZ: {ride.plz}</div>
                <div className="detail-item">🏠 Adrese: {ride.brojAdresa}</div>
                <div className="detail-item">💰 Cijena: {ride.cijena} KM</div>
              </div>
              
              <div className="ride-actions">
                <ActionButton 
                  onClick={() => handleApprove(ride.id)} 
                  bgColor="#28a745"
                  disabled={actionLoading}
                >
                  ✅ Odobri
                </ActionButton>
                <ActionButton 
                  onClick={() => handleReject(ride.id)} 
                  bgColor="#dc3545"
                  disabled={actionLoading}
                >
                  ❌ Odbij
                </ActionButton>
                <ActionButton 
                  onClick={() => { setSelectedRide(ride); setModalVisible(true); }} 
                  bgColor="#007bff"
                  disabled={actionLoading}
                >
                  📄 Detalji
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ModalForm 
        open={modalVisible} 
        title="Detalji vožnje" 
        onClose={() => setModalVisible(false)} 
        onSubmit={() => setModalVisible(false)} 
        loading={false}
      >
        {selectedRide && (
          <div className="ride-modal-details">
            <div className="detail-row">
              <span className="label">Vozač:</span>
              <span className="value">{selectedRide.vozac}</span>
            </div>
            <div className="detail-row">
              <span className="label">Datum:</span>
              <span className="value">{selectedRide.datum}</span>
            </div>
            <div className="detail-row">
              <span className="label">Tura:</span>
              <span className="value">{selectedRide.tura}</span>
            </div>
            <div className="detail-row">
              <span className="label">PLZ:</span>
              <span className="value">{selectedRide.plz}</span>
            </div>
            <div className="detail-row">
              <span className="label">Broj adresa:</span>
              <span className="value">{selectedRide.brojAdresa}</span>
            </div>
            <div className="detail-row">
              <span className="label">Cijena:</span>
              <span className="value">{selectedRide.cijena} KM</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span className="value">
                <StatusBadge status={selectedRide.status}>
                  {selectedRide.status}
                </StatusBadge>
              </span>
            </div>
            {selectedRide.napomena && (
              <div className="detail-row">
                <span className="label">Napomena:</span>
                <span className="value">{selectedRide.napomena}</span>
              </div>
            )}
          </div>
        )}
      </ModalForm>
    </div>
  );
};

export default RidesApprovalTab;
