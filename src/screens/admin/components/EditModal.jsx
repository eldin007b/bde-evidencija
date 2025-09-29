import React from 'react';
import ModalForm from '../../../components/common/ModalForm';

const EditModal = ({ open, onClose, onSubmit, loading, children, title = 'Uredi vozača', submitLabel = 'Sačuvaj', closeLabel = 'Otkaži' }) => (
  <ModalForm
    open={open}
    title={title}
    loading={loading}
    onSubmit={onSubmit}
    onClose={onClose}
    submitLabel={submitLabel}
    closeLabel={closeLabel}
  >
    {children}
  </ModalForm>
);

export default EditModal;
