import React, { useState } from 'react';
import ActionButton from '../../components/common/ActionButton';
import EmptyState from '../../components/common/EmptyState';
import ModalForm from '../../components/common/ModalForm';

const SecurityTab = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: 16, background: '#fff' }}>
      <h2 style={{ fontWeight: 'bold', marginBottom: 16 }}>Sigurnost</h2>
      <ActionButton onClick={() => setModalVisible(true)} bgColor="#1976d2" style={{ marginBottom: 16 }}>
        Promijeni lozinku
      </ActionButton>
      <EmptyState icon={<span>🔒</span>} text="Sigurnosne opcije" subtext="Ovdje će biti opcije za promjenu lozinke, pristup logovima i druge sigurnosne funkcije." />
      <ModalForm open={modalVisible} title="Promjena lozinke" onClose={() => setModalVisible(false)} onSubmit={() => {}} loading={loading}>
        {/* Forma za promjenu lozinke */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input type="password" placeholder="Stara lozinka" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
          <input type="password" placeholder="Nova lozinka" style={{ padding: 8, borderRadius: 6, border: '1px solid #ccc' }} />
        </div>
      </ModalForm>
    </div>
  );
};

export default SecurityTab;
