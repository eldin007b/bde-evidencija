import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/shared/Toast';
import PDFViewer from '../components/common/PDFViewer';
// ISPRAVLJENA PUTANJA: Idemo gore u src, pa u db folder
import { supabase } from '../db/supabaseClient'; 
import './PayrollScreen.css';

/**
 * PayrollScreen - Pregled platnih lista iz Supabase DB i Storage-a
 */
function PayrollScreen({ user }) {
  const navigate = useNavigate();
  const [payrollFiles, setPayrollFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  const [pdfViewer, setPdfViewer] = useState({ isOpen: false, url: null, fileName: null });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role === 'admin') {
      setError('Admini nemaju pristup platnim listama');
      setLoading(false);
      return;
    }
    loadPayrollFiles(user.username);
  }, [user, navigate]);

  const loadPayrollFiles = async (driverUsername) => {
    try {
      setLoading(true);
      
      // Povlačimo podatke iz tabele 'payrolls' za ulogovanog vozača
      const { data, error: dbError } = await supabase
        .from('payrolls')
        .select('*')
        .eq('driver_name', driverUsername.toLowerCase());

      if (dbError) throw dbError;

      // SORTIRANJE: Najnoviji unos (2026) ide prvi na listu
      const sortedData = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const formattedFiles = sortedData.map(item => ({
        id: item.id,
        // Pretvara "01_2026.pdf" u "01/2026" za ljepši prikaz
        month: item.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/'),
        fileName: item.file_name,
        fileId: item.id,
        uploadDate: item.created_at,
        size: 'PDF'
      }));

      setPayrollFiles(formattedFiles);
    } catch (err) {
      console.error('Greška pri učitavanju:', err);
      setError('Sistem nije mogao učitati vaše platne liste.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayroll = async (file) => {
    try {
      setDownloading(file.id);
      // Putanja u storage-u: username/filename.pdf
      const filePath = `${user.username.toLowerCase()}/${file.fileName}`;
      
      const { data, error: storageError } = await supabase.storage
        .from('payroll-lists')
        .download(filePath);

      if (storageError) throw storageError;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({ open: true, type: 'success', message: 'Platna lista preuzeta!' });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Greška pri preuzimanju fajla.' });
    } finally {
      setDownloading(null);
    }
  };

  const viewPayroll = async (file) => {
    try {
      const filePath = `${user.username.toLowerCase()}/${file.fileName}`;
      const { data, error: urlError } = await supabase.storage
        .from('payroll-lists')
        .createSignedUrl(filePath, 60);

      if (urlError) throw urlError;

      setPdfViewer({ isOpen: true, url: data.signedUrl, fileName: file.fileName });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Nije moguće otvoriti PDF.' });
    }
  };

  if (loading) return (
    <div className="payroll-screen">
      <div className="payroll-loading"><LoadingSpinner /><p>Učitavam platne liste...</p></div>
    </div>
  );

  if (error) return (
    <div className="payroll-screen">
      <div className="payroll-error"><h2>Greška</h2><p>{error}</p></div>
    </div>
  );

  return (
    <div className="payroll-screen">
      <div className="payroll-header">
        <button className="back-button" onClick={() => navigate('/')}>Nazad</button>
        <div className="header-info">
          <h1>💰 Moje Platne Liste</h1>
          <p>Korisnik: <strong>{user?.name}</strong></p>
        </div>
      </div>

      <div className="payroll-content">
        {payrollFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Nema dostupnih platnih lista</h3>
            <p>Provjerite ponovo kasnije ili kontaktirajte admina.</p>
          </div>
        ) : (
          <div className="payroll-grid">
            {payrollFiles.map((file) => (
              <div key={file.id} className="payroll-card">
                <div className="card-header">
                  <div className="month-badge">{file.month}</div>
                  <div className="file-size">{file.size}</div>
                </div>
                <div className="card-body">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <h3>{file.fileName}</h3>
                    <p>Objavljeno: {new Date(file.uploadDate).toLocaleDateString('bs-BA')}</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="view-button" onClick={() => viewPayroll(file)}>Prikaži</button>
                  <button 
                    className={`download-button ${downloading === file.id ? 'downloading' : ''}`}
                    onClick={() => downloadPayroll(file)}
                    disabled={downloading === file.id}
                  >
                    {downloading === file.id ? '...' : 'Preuzmi'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast.open && (
        <Toast
          isOpen={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}

      <PDFViewer
        pdfUrl={pdfViewer.url}
        fileName={pdfViewer.fileName}
        isVisible={pdfViewer.isOpen}
        onClose={() => setPdfViewer({ isOpen: false, url: null, fileName: null })}
      />
    </div>
  );
}

export default PayrollScreen
w
