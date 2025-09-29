import React, { useState } from 'react';
import ActionButton from '../../components/common/ActionButton';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import ModalForm from '../../components/common/ModalForm';
import useDeviceApprovals from '../../hooks/useDeviceApprovals';

const DevicesTab = () => {
  const {
    devices,
    loading: deviceLoading,
    blockDevice,
    resetDeviceTura
  } = useDeviceApprovals();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [deviceActionLoading, setDeviceActionLoading] = useState(false);
  const isTablet = window.innerWidth > 700;

  return (
    <div style={{ padding: 16, background: '#fff' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 16 }}>Uređaji</h2>
      {deviceLoading ? (
        <div>Učitavanje...</div>
      ) : devices && devices.length === 0 ? (
        <EmptyState icon={<span>📱</span>} text="Nema uređaja" subtext="Nema registrovanih uređaja." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isTablet ? 2 : 1}, 1fr)`, gap: 12 }}>
          {devices && devices.map(device => (
            <div key={device.id} style={{ background: '#e9ecef', borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 16 }}>{device.name}</span>
                <StatusBadge status={device.status} />
              </div>
              <div style={{ color: '#bbb', fontSize: 13 }}>{device.info}</div>
              <div style={{ display: 'flex', marginTop: 10, gap: 8 }}>
                <ActionButton loading={deviceActionLoading} onClick={() => blockDevice(device.id)} bgColor="#c62828">Blokiraj</ActionButton>
                <ActionButton loading={deviceActionLoading} onClick={() => resetDeviceTura(device.id)} bgColor="#007bff">Reset tura</ActionButton>
              </div>
            </div>
          ))}
        </div>
      )}
      <ModalForm open={deviceModalVisible} title="Detalji uređaja" onClose={() => setDeviceModalVisible(false)} onSubmit={() => {}} loading={deviceActionLoading}>
        {/* Forma za uređaj, polja, akcije... */}
      </ModalForm>
    </div>
  );
};

export default DevicesTab;
