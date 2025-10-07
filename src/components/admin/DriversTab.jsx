import React, { useState } from 'react';
import ActionButton from '../common/ActionButton';
import StatusBadge from '../common/StatusBadge';
import EmptyState from '../common/EmptyState';
import ModernModal from './ModernModal';
import useDrivers from '../../hooks/useDrivers';

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
  const [showPasswords, setShowPasswords] = useState({});
  
  // Form podataci
  const [formData, setFormData] = useState({
    ime: '',
    tura: '',
    aktivan: true,
    target_per_day: 0,
    password_hash: '',
    role: 'driver'
  });

  const isTablet = window.innerWidth > 700;

  const togglePasswordVisibility = (driverId) => {
    setShowPasswords(prev => ({
      ...prev,
      [driverId]: !prev[driverId]
    }));
  };

  const decodePassword = (passwordHash) => {
    try {
      // Dekoduj Base64 password
      return atob(passwordHash);
    } catch (error) {
      // Ako nije Base64, vrati originalni
      return passwordHash;
    }
  };

  const encodePassword = (password) => {
    try {
      // Enkoduj password u Base64
      return btoa(password);
    } catch (error) {
      // Ako greška, vrati originalni
      return password;
    }
  };

  const handleAddDriver = async () => {
    setFormLoading(true);
    try {
      // Enkoduj password prije slanja
      const driverDataToSend = {
        ...formData,
        password_hash: formData.password_hash ? encodePassword(formData.password_hash) : ''
      };
      await addDriver(driverDataToSend);
      setAddModalVisible(false);
      setFormData({
        ime: '',
        tura: '',
        aktivan: true,
        target_per_day: 0,
        password_hash: '',
        role: 'driver'
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
      // Enkoduj password prije slanja (samo ako je novo unesen)
      const driverDataToSend = {
        ...formData,
        password_hash: formData.password_hash ? encodePassword(formData.password_hash) : selectedDriver.password_hash
      };
      await updateDriver(selectedDriver.id, driverDataToSend);
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
      password_hash: driver.password_hash ? decodePassword(driver.password_hash) : '',
      role: driver.role || 'driver'
    });
    setEditModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({
      ime: '',
      tura: '',
      aktivan: true,
      target_per_day: 0,
      password_hash: '',
      role: 'driver'
    });
    setAddModalVisible(true);
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
        <h2 style={{ fontWeight: 'bold', margin: 0, color: 'var(--text-on-dark, #f1f5f9)' }}>👤 Upravljanje korisnicima</h2>
        <ActionButton 
          onClick={openAddModal} 
          bgColor="#007bff"
        >
          ➕ Dodaj korisnika
        </ActionButton>
      </div>

      {/* Statistika */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <div style={{ 
          background: 'rgba(76, 175, 80, 0.15)', 
          borderRadius: 16, 
          padding: 16, 
          flex: 1, 
          border: '1px solid rgba(76, 175, 80, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ Aktivni: {drivers.filter(d => d.aktivan).length}</span>
        </div>
        <div style={{ 
          background: 'rgba(255, 193, 7, 0.15)', 
          borderRadius: 16, 
          padding: 16, 
          flex: 1, 
          border: '1px solid rgba(255, 193, 7, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>⏸️ Neaktivni: {drivers.filter(d => !d.aktivan).length}</span>
        </div>
        <div style={{ 
          background: 'rgba(33, 150, 243, 0.15)', 
          borderRadius: 16, 
          padding: 16, 
          flex: 1, 
          border: '1px solid rgba(33, 150, 243, 0.3)',
          backdropFilter: 'blur(5px)'
        }}>
          <span style={{ color: '#2196f3', fontWeight: 'bold' }}>📊 Ukupno: {drivers.length}</span>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(220, 53, 69, 0.15)',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#dc3545'
        }}>
          ❌ Greška: {error.message}
        </div>
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ color: 'var(--text-on-dark, #f1f5f9)' }}>🔄 Učitavanje korisnika...</div>
        </div>
      ) : drivers.length === 0 ? (
        <EmptyState 
          icon={<span>👤</span>} 
          text="Nema korisnika" 
          subtext="Nema registrovanih korisnika." 
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isTablet ? 2 : 1}, 1fr)`, gap: 12 }}>
          {drivers.map(driver => (
            <div key={driver.id} style={{
              background: driver.aktivan 
                ? 'rgba(76, 175, 80, 0.1)' 
                : 'rgba(255, 193, 7, 0.1)',
              border: driver.aktivan 
                ? '1px solid rgba(76, 175, 80, 0.3)' 
                : '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: 12,
              padding: 14,
              backdropFilter: 'blur(5px)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 16, color: 'var(--text-on-dark, #f1f5f9)' }}>
                  👤 {driver.ime}
                </span>
                <StatusBadge status={driver.aktivan ? 'active' : 'blocked'}>
                  {driver.aktivan ? '✅ Aktivan' : '⏸️ Blokiran'}
                </StatusBadge>
              </div>
              
              <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>
                  🚛 Tura: <strong>{driver.tura}</strong>
                </div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>
                  🎯 Target/dan: <strong>{driver.target_per_day || 0}</strong>
                </div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>
                  🔑 Password: 
                  <strong>
                    {driver.password_hash ? (
                      showPasswords[driver.id] ? decodePassword(driver.password_hash) : '••••••••'
                    ) : 'N/A'}
                  </strong>
                  {driver.password_hash && (
                    <button
                      onClick={() => togglePasswordVisibility(driver.id)}
                      style={{
                        marginLeft: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        color: 'var(--text-on-dark, #f1f5f9)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        backdropFilter: 'blur(5px)'
                      }}
                    >
                      {showPasswords[driver.id] ? '🙈' : '👁️'}
                    </button>
                  )}
                </div>
                <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>
                  🔐 Uloga: <strong>{driver.role === 'admin' ? '👑 Admin' : '👤 Vozač'}</strong>
                </div>
                {driver.last_login && (
                  <div style={{ color: 'var(--text-on-dark, #f1f5f9)', opacity: 0.8, fontSize: 13 }}>
                    🕐 Zadnji login: <strong>{new Date(driver.last_login).toLocaleDateString('bs-BA')}</strong>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
      
      {/* Modal za dodavanje korisnika */}
      <ModernModal 
        open={addModalVisible} 
        title="➕ Dodaj novog korisnika" 
        onClose={() => setAddModalVisible(false)} 
        onSubmit={handleAddDriver} 
        loading={formLoading}
        submitLabel="💾 Dodaj korisnika"
        closeLabel="❌ Otkaži"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>👤 Ime korisnika:</label>
            <input
              type="text"
              value={formData.ime}
              onChange={(e) => setFormData({...formData, ime: e.target.value})}
              placeholder="Unesite ime korisnika"
              required
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
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🚛 Tura:</label>
            <input
              type="text"
              value={formData.tura}
              onChange={(e) => setFormData({...formData, tura: e.target.value})}
              placeholder="npr. A1, B2, C3..."
              required
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🎯 Target po danu:</label>
              <input
                type="number"
                value={formData.target_per_day}
                onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
                placeholder="0"
                min="0"
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🔐 Uloga:</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
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
              >
                <option value="user">👤 Korisnik</option>
                <option value="admin">👑 Administrator</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🔑 Password:</label>
            <input
              type="password"
              value={formData.password_hash}
              onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
              placeholder="Unesite password"
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="addActiveCheckbox"
              checked={formData.aktivan}
              onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
              style={{ accentColor: '#4caf50' }}
            />
            <label 
              htmlFor="addActiveCheckbox" 
              style={{ color: 'var(--text-on-dark, #f1f5f9)', fontSize: '14px' }}
            >
              ✅ Aktivan korisnik
            </label>
          </div>
        </div>
      </ModernModal>

      {/* Modal za uređivanje korisnika */}
      <ModernModal 
        open={editModalVisible} 
        title="✏️ Uredi korisnika" 
        onClose={() => setEditModalVisible(false)} 
        onSubmit={handleEditDriver} 
        loading={formLoading}
        submitLabel="💾 Sačuvaj promjene"
        closeLabel="❌ Otkaži"
      >
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>👤 Ime korisnika:</label>
            <input
              type="text"
              value={formData.ime}
              onChange={(e) => setFormData({...formData, ime: e.target.value})}
              placeholder="Unesite ime korisnika"
              required
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
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🚛 Tura:</label>
            <input
              type="text"
              value={formData.tura}
              onChange={(e) => setFormData({...formData, tura: e.target.value})}
              placeholder="npr. A1, B2, C3..."
              required
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🎯 Target po danu:</label>
              <input
                type="number"
                value={formData.target_per_day}
                onChange={(e) => setFormData({...formData, target_per_day: parseInt(e.target.value) || 0})}
                placeholder="0"
                min="0"
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🔐 Uloga:</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
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
              >
                <option value="driver">👤 Vozač</option>
                <option value="admin">👑 Administrator</option>
              </select>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold', color: 'var(--text-on-dark, #f1f5f9)' }}>🔑 Password:</label>
            <input
              type="password"
              value={formData.password_hash}
              onChange={(e) => setFormData({...formData, password_hash: e.target.value})}
              placeholder="Ostavite prazno da ne mijenjate"
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="editActiveCheckbox"
              checked={formData.aktivan}
              onChange={(e) => setFormData({...formData, aktivan: e.target.checked})}
              style={{ accentColor: '#4caf50' }}
            />
            <label 
              htmlFor="editActiveCheckbox" 
              style={{ color: 'var(--text-on-dark, #f1f5f9)', fontSize: '14px' }}
            >
              ✅ Aktivan korisnik
            </label>
          </div>
        </div>
      </ModernModal>
    </div>
  );
};

export default DriversTab;