import React, { useState } from 'react';

const PasswordChangeModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return null;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) return { level: 'weak', text: '🔴 Slaba lozinka', color: 'text-red-500' };
    if (score < 4) return { level: 'medium', text: '🟡 Srednja lozinka', color: 'text-yellow-500' };
    return { level: 'strong', text: '🟢 Jaka lozinka', color: 'text-green-500' };
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.oldPassword) errors.oldPassword = 'Stara lozinka je obavezna';
    if (!formData.newPassword) {
      errors.newPassword = 'Nova lozinka je obavezna';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Nova lozinka mora imati najmanje 6 karaktera';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Potvrda lozinke je obavezna';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Lozinke se ne poklapaju';
    }
    
    if (formData.oldPassword && formData.oldPassword === formData.newPassword) {
      errors.newPassword = 'Nova lozinka mora biti različita od stare';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors(prev => ({ ...prev, [field]: null }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setValidationErrors({ submit: error.message || 'Greška pri promeni lozinke' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.oldPassword && formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword && formData.newPassword.length >= 6 && formData.oldPassword !== formData.newPassword;

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <form className="bg-slate-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-slate-700" onSubmit={handleSubmit}>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">🔐 Promena lozinke</h2>
        <p className="text-sm text-slate-400">Unesite staru lozinku i definišite novu sigurnu lozinku</p>
      </div>

      <div className="space-y-4">
        {['old', 'new', 'confirm'].map((field, idx) => {
          const fieldName = field === 'old' ? 'oldPassword' : field === 'new' ? 'newPassword' : 'confirmPassword';
          const labels = { old: 'Trenutna lozinka', new: 'Nova lozinka', confirm: 'Potvrdite novu lozinku' };
          
          return (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-300 mb-1">{labels[field]}</label>
              <div className="relative">
                <input
                  type={showPasswords[field] ? 'text' : 'password'}
                  value={formData[fieldName]}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 focus:ring-2 focus:ring-indigo-500"
                />
                <button type="button" className="absolute right-3 top-2.5 text-slate-400 hover:text-white" onClick={() => togglePasswordVisibility(field)}>
                  {showPasswords[field] ? '👁️' : '🙈'}
                </button>
              </div>
              {validationErrors[fieldName] && <div className="text-red-500 text-xs mt-1">❌ {validationErrors[fieldName]}</div>}
            </div>
          );
        })}
      </div>

      {passwordStrength && <div className={`text-xs mt-2 ${passwordStrength.color}`}>{passwordStrength.text}</div>}

      <div className="mt-6 flex justify-end gap-3">
        <button type="button" className="px-4 py-2 text-slate-400 hover:text-white" onClick={onClose} disabled={isSubmitting}>Otkaži</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? '🔄 Menjam...' : '🔐 Promeni lozinku'}
        </button>
      </div>
    </form>
  );
};

export default PasswordChangeModal;