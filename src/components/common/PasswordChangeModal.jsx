import React, { useState } from 'react';
import styles from './PasswordChangeModal.module.css';

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
    
    if (score < 3) return { level: 'weak', text: '🔴 Slaba lozinka' };
    if (score < 4) return { level: 'medium', text: '🟡 Srednja lozinka' };
    return { level: 'strong', text: '🟢 Jaka lozinka' };
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.oldPassword) {
      errors.oldPassword = 'Stara lozinka je obavezna';
    }
    
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
    
    if (formData.oldPassword === formData.newPassword) {
      errors.newPassword = 'Nova lozinka mora biti različita od stare';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
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

  const isFormValid = formData.oldPassword && 
                     formData.newPassword && 
                     formData.confirmPassword && 
                     formData.newPassword === formData.confirmPassword &&
                     formData.newPassword.length >= 6 &&
                     formData.oldPassword !== formData.newPassword;

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <form className={styles.modalForm} onSubmit={handleSubmit}>
      {/* Header */}
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          🔐 Promena lozinke
        </h2>
        <p className={styles.formSubtitle}>
          Unesite staru lozinku i definišite novu sigurnu lozinku
        </p>
      </div>

      {/* Old Password */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="oldPassword">
          Trenutna lozinka
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="oldPassword"
            type={showPasswords.old ? 'text' : 'password'}
            value={formData.oldPassword}
            onChange={(e) => handleInputChange('oldPassword', e.target.value)}
            placeholder="Unesite trenutnu lozinku"
            className={styles.passwordInput}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => togglePasswordVisibility('old')}
            aria-label="Prikaži/sakrij lozinku"
          >
            {showPasswords.old ? '👁️' : '🙈'}
          </button>
        </div>
        {validationErrors.oldPassword && (
          <div className={`${styles.validationMessage} ${styles.validationError}`}>
            ❌ {validationErrors.oldPassword}
          </div>
        )}
      </div>

      {/* New Password */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="newPassword">
          Nova lozinka
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            placeholder="Unesite novu lozinku"
            className={styles.passwordInput}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => togglePasswordVisibility('new')}
            aria-label="Prikaži/sakrij lozinku"
          >
            {showPasswords.new ? '👁️' : '🙈'}
          </button>
        </div>
        
        {/* Password Strength Indicator */}
        {passwordStrength && (
          <div className={`${styles.strengthIndicator} ${styles[`strength${passwordStrength.level.charAt(0).toUpperCase() + passwordStrength.level.slice(1)}`]}`}>
            {passwordStrength.text}
          </div>
        )}
        
        {validationErrors.newPassword && (
          <div className={`${styles.validationMessage} ${styles.validationError}`}>
            ❌ {validationErrors.newPassword}
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="confirmPassword">
          Potvrdite novu lozinku
        </label>
        <div className={styles.inputWrapper}>
          <input
            id="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Ponovite novu lozinku"
            className={styles.passwordInput}
            autoComplete="new-password"
          />
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => togglePasswordVisibility('confirm')}
            aria-label="Prikaži/sakrij lozinku"
          >
            {showPasswords.confirm ? '👁️' : '🙈'}
          </button>
        </div>
        
        {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
          <div className={`${styles.validationMessage} ${styles.validationSuccess}`}>
            ✅ Lozinke se poklapaju
          </div>
        )}
        
        {validationErrors.confirmPassword && (
          <div className={`${styles.validationMessage} ${styles.validationError}`}>
            ❌ {validationErrors.confirmPassword}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className={styles.securityTips}>
        <h4>💡 Saveti za sigurnu lozinku:</h4>
        <ul>
          <li>Najmanje 8 karaktera</li>
          <li>Kombinacija velikih i malih slova</li>
          <li>Brojevi i specijalni karakteri (!@#$%)</li>
          <li>Izbegavajte lične podatke</li>
        </ul>
      </div>

      {/* Submit Error */}
      {validationErrors.submit && (
        <div className={`${styles.validationMessage} ${styles.validationError}`}>
          ❌ {validationErrors.submit}
        </div>
      )}

      {/* Actions */}
      <div className={styles.modalActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onClose}
          disabled={isSubmitting}
        >
          ❌ Otkaži
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? '🔄 Menjam...' : '🔐 Promeni lozinku'}
        </button>
      </div>
    </form>
  );
};

export default PasswordChangeModal;