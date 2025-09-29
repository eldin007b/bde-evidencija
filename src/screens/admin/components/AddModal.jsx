import React from 'react';
import ModalForm from '../../../components/common/ModalForm';

const AddModal = ({ open, onClose, onSubmit, loading, children, title = 'Dodaj vozača', submitLabel = 'Sačuvaj', closeLabel = 'Otkaži' }) => (
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

export default AddModal;
