import React, { useState } from 'react';
import ActionButton from '../../components/common/ActionButton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ModalForm from '../../components/common/ModalForm';
import useDrivers from '../../hooks/useDrivers';
import './DriversTab.css';

const DriversTab = () => {
  const { 
    drivers, 
    loading, 
    error, 
    addDriver, 
    updateDriver, 
    deleteDriver, 
    toggleDriverStatus 
  } = useDrivers();
  
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form podataci
  const [formData, setFormData] = useState({
    ime: '',
    tura: '',
    aktivan: true,
    target_per_day: 0,
    device_id: '',
    role: 'user'
  });

  const isTablet = window.innerWidth > 700;

  const handleAddDriver = async () => {
    setFormLoading(true);
    try {
      await addDriver(formData);
      setAddModalVisible(false);
      setFormData({
        ime: '',
        tura: '',
        aktivan: true,
        target_per_day: 0,
        device_id: '',
        role: 'user'
      });
    } catch (error) {
      console.error('Greška pri dodavanju vozača:', error);
      alert('Greška pri dodavanju vozača: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditDriver = async () => {
    if (!selectedDriver) return;
    setFormLoading(true);
    try {
      await updateDriver(selectedDriver.id, formData);
      setEditModalVisible(false);
      setSelectedDriver(null);
    } catch (error) {
      console.error('Greška pri ažuriranju vozača:', error);
      alert('Greška pri ažuriranju vozača: ' + error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDriver = async (driver) => {
    if (window.confirm(`Da li ste sigurni da želite obrisati vozača ${driver.ime}?`)) {
      try {
        await deleteDriver(driver.id);
      } catch (error) {
        console.error('Greška pri brisanju vozača:', error);
        alert('Greška pri brisanju vozača: ' + error.message);
      }
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      await toggleDriverStatus(driver.id, driver.aktivan);
    } catch (error) {
      console.error('Greška pri mijenjanju statusa:', error);
      alert('Greška pri mijenjanju statusa: ' + error.message);
    }
  };

  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    setFormData({
      ime: driver.ime,
      tura: driver.tura,
      aktivan: driver.aktivan,
      target_per_day: driver.target_per_day || 0,
      device_id: driver.device_id || '',
      role: driver.role || 'user'
    });
    setEditModalVisible(true);
  };

  return (
    <div className="drivers-tab-container">
      <div className="drivers-header">
        <h2>Vozači</h2>
        <ActionButton 
          onClick={() => setAddModalVisible(true)} 
          bgColor="#007bff"
        >
          ➕ Dodaj vozača
        </ActionButton>
      </div>

      {error && (
        <div className="error-message">
          Greška: {error.message}
        </div>
      )}
      
      {loading ? (
        <div className="loading-state">Učitavanje...</div>
      ) : drivers.length === 0 ? (
        <EmptyState 
          icon={<span>🚗</span>} 
          text="Nema vozača" 
          subtext="Nema registrovanih vozača." 
        />
      ) : (
        <div className={`drivers-grid ${isTablet ? 'tablet' : 'mobile'}`}>
          {drivers.map(driver => (
            <div key={driver.id} className="driver-card">
              <div className="driver-header">
                <span className="driver-name">{driver.ime}</span>
                <StatusBadge status={driver.aktivan ? 'active' : 'blocked'}>
                  {driver.aktivan ? 'Aktivan' : 'Blokiran'}
                </StatusBadge>
              </div>
              
              <div className="driver-details">
                <div className="detail-item">
                  <span className="label">Tura:</span>
                  <span className="value">{driver.tura}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Target/dan:</span>
                  <span className="value">{driver.target_per_day || 0}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Device ID:</span>
                  <span className="value">{driver.device_id || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Uloga:</span>
                  <span className="value">{driver.role}</span>
                </div>
                {driver.last_login && (
                  <div className="detail-item">
                    <span className="label">Zadnji login:</span>
                    <span className="value">
                      {new Date(driver.last_login).toLocaleDateString('bs-BA')}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="driver-actions">
                <ActionButton 
                  onClick={() => openEditModal(driver)} 
                  bgColor="#007bff"
                >
                  ✏️ Uredi
                </ActionButton>
                <ActionButton 
                  onClick={() => handleToggleStatus(driver)} 
                  bgColor={driver.aktivan ? "#ff9800" : "#4caf50"}
                >
                  {driver.aktivan ? "⏸️ Deaktiviraj" : "▶️ Aktiviraj"}
                </ActionButton>
                <ActionButton 
                  onClick={() => handleDeleteDriver(driver)} 
                  bgColor="#dc3545"
                >
                  🗑️ Obriši
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal za dodavanje vozača */}
      <ModalForm 
        open={addModalVisible} 
        title="Dodaj novog vozača" 
        onClose={() => setAddModalVisible(false)} 
        onSubmit={handleAddDriver} 
        loading={formLoading}
      >
        <div className="driver-form">
          <div className="form-row">
            <label>Ime vozača:</label>
            <input
              type="text"
              value={formData.ime}
              onChange={(e) => setFormData({...formData, ime: e.target.value})}
              placeholder="Unesite ime vozača"
              required
            />
          </div>
          <div className="form-row">
            <label>Tura:</label>
            <input
              type="text"
              value={formData.tura}
              onChange={(e) => setFormData({...formData, tura: e.target.value})}
              placeholder="npr. A1, B2, C3..."
              required
            />
          </div>
          <div className="form-row">
            <label>Target po danu:</label>
            <input
              type="number"
              value={formData.target_per_day}
              onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="form-row">
            <label>Device ID:</label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({...formData, device_id: e.target.value})}
              placeholder="Opcionalno"
            />
          </div>
          <div className="form-row">
            <label>Uloga:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">Korisnik</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.aktivan}
                onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
              />
              Aktivan vozač
            </label>
          </div>
        </div>
      </ModalForm>

      {/* Modal za uređivanje vozača */}
      <ModalForm 
        open={editModalVisible} 
        title="Uredi vozača" 
        onClose={() => setEditModalVisible(false)} 
        onSubmit={handleEditDriver} 
        loading={formLoading}
      >
        <div className="driver-form">
          <div className="form-row">
            <label>Ime vozača:</label>
            <input
              type="text"
              value={formData.ime}
              onChange={(e) => setFormData({...formData, ime: e.target.value})}
              placeholder="Unesite ime vozača"
              required
            />
          </div>
          <div className="form-row">
            <label>Tura:</label>
            <input
              type="text"
              value={formData.tura}
              onChange={(e) => setFormData({...formData, tura: e.target.value})}
              placeholder="npr. A1, B2, C3..."
              required
            />
          </div>
          <div className="form-row">
            <label>Target po danu:</label>
            <input
              type="number"
              value={formData.target_per_day}
              onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="form-row">
            <label>Device ID:</label>
            <input
              type="text"
              value={formData.device_id}
              onChange={(e) => setFormData({...formData, device_id: e.target.value})}
              placeholder="Opcionalno"
            />
          </div>
          <div className="form-row">
            <label>Uloga:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="user">Korisnik</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.aktivan}
                onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
              />
              Aktivan vozač
            </label>
          </div>
        </div>
      </ModalForm>
    </div>
  );
};

export default DriversTab;
