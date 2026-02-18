import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/shared/Toast';
import PDFViewer from '../components/common/PDFViewer';
import { supabase } from '../supabaseClient'; // Osiguraj da je putanja ispravna
import './PayrollScreen.css';

/**
 * PayrollScreen - Pregled i preuzimanje platnih lista iz Supabase baze i storage-a
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

  // Učitaj platne liste direktno iz Supabase tabele 'payrolls'
  const loadPayrollFiles = async (driverUsername) => {
    try {
      setLoading(true);
      
      // Dohvaćamo sve zapise za ulogovanog vozača
      const { data, error: dbError } = await supabase
        .from('payrolls')
        .select('*')
        .eq('driver_name', driverUsername.toLowerCase());

      if (dbError) throw dbError;

      // SORTIRANJE: Najnoviji 'created_at' ide prvi (tako će 2026 biti na vrhu)
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Mapiranje podataka iz baze u format koji tvoj UI očekuje
      const formattedFiles = sortedData.map(item => ({
        id: item.id,
        // Pretvara "01_2026.pdf" u "01/2026"
        month: item.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/'),
        fileName: item.file_name,
        fileId: item.id,
        uploadDate: item.created_at,
        size: 'PDF'
      }));

      setPayrollFiles(formattedFiles);
      setLoading(false);

    } catch (error) {
      console.error('Greška pri učitavanju:', error);
      setError('Greška pri učitavanju podataka iz baze.');
      setLoading(false);
    }
  };

  // Preuzimanje iz Supabase Storage-a
  const downloadPayroll = async (file) => {
    try {
      setDownloading(file.id);
      
      // Putanja: username/file_name (kako je postavljeno u Admin panelu)
      const filePath = `${user.username.toLowerCase()}/${file.fileName}`;
      
      const { data, error } = await supabase.storage
        .from('payroll-lists')
        .download(filePath);

      if (error) throw error;

      // Kreiranje linka za preuzimanje
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        open: true,
        type: 'success',
        message: `Platna lista ${file.month} je preuzeta!`
      });
      
    } catch (error) {
      console.error('Greška pri preuzimanju:', error);
      setToast({
        open: true,
        type: 'error',
        message: 'Fajl nije pronađen u storage-u.'
      });
    } finally {
      setDownloading(null);
    }
  };

  // Prikaz PDF-a
  const viewPayroll = async (file) => {
    try {
      const filePath = `${user.username.toLowerCase()}/${file.fileName}`;
      
      const { data, error } = await supabase.storage
        .from('payroll-lists')
        .createSignedUrl(filePath, 60); // Link važi 60 sekundi

      if (error) throw error;

      setPdfViewer({
        isOpen: true,
        url: data.signedUrl,
        fileName: file.fileName
      });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Nije moguće otvoriti PDF.' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bs-BA');
  };

  // ... OSTATAK JSX-a ostaje ISTI kao tvoj originalni (za Loading, Error, Table) ...
  if (loading) return <div className="payroll-screen"><div className="payroll-loading"><LoadingSpinner /><p>Učitavam...</p></div></div>;
  if (error) return <div className="payroll-screen"><div className="payroll-error"><h2>Greška</h2><p>{error}</p></div></div>;

  return (
    <div className="payroll-screen">
      <div className="payroll-header">
        <button className="back-button" onClick={() => navigate('/')}>Nazad</button>
        <div className="header-info">
          <h1>💰 Platne Liste</h1>
          <p>Vozač: <strong>{user?.name}</strong></p>
        </div>
      </div>

      <div className="payroll-content">
        {payrollFiles.length === 0 ? (
          <div className="empty-state"><h3>Nema dostupnih platnih lista</h3></div>
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
                    <p>Datum: {formatDate(file.uploadDate)}</p>
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

      {toast.open && <Toast isOpen={toast.open} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, open: false })} />}
      <PDFViewer pdfUrl={pdfViewer.url} fileName={pdfViewer.fileName} isVisible={pdfViewer.isOpen} onClose={() => setPdfViewer({ isOpen: false, url: null, fileName: null })} />
    </div>
  );
}

export default PayrollScreen;
