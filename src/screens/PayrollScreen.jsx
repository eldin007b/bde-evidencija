import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/shared/Toast';
import PDFViewer from '../components/common/PDFViewer';
import googleDriveService from '../services/GoogleDriveService';
import './PayrollScreen.css';

/**
 * PayrollScreen - Pregled i preuzimanje platnih lista za vozače
 * Struktura u Google Drive: Platne liste/{vozac_id}/{mjesec}/file.pdf
 */
function PayrollScreen({ user }) {
  const navigate = useNavigate();
  const [payrollFiles, setPayrollFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  const [pdfViewer, setPdfViewer] = useState({ isOpen: false, url: null, fileName: null });

  // Učitaj platne liste za vozača
  useEffect(() => {
    try {
      if (!user) {
        navigate('/');
        return;
      }
      
      // Provjeri da li je vozač
      if (user.role === 'admin') {
        setError('Admini nemaju pristup platnim listama');
        setLoading(false);
        return;
      }
      
      // Učitaj platne liste za ovog vozača
      loadPayrollFiles(user.username);
      
    } catch (error) {
      console.error('Greška pri učitavanju korisničkih podataka:', error);
      setError('Greška pri učitavanju korisničkih podataka');
      setLoading(false);
    }
  }, [user, navigate]);

  // Učitaj platne liste iz Google Drive
  const loadPayrollFiles = async (driverId) => {
    try {
      setLoading(true);
      
      // Provjeri da li su potrebne env varijable postavljene
      if (!import.meta.env.VITE_GOOGLE_DRIVE_API_KEY) {
        console.warn('Google Drive API ključ nije postavljen, koristim mock podatke');
        loadMockData();
        return;
      }
      
      // Pozovi Google Drive API
      const files = await googleDriveService.getPayrollFiles(driverId);
      setPayrollFiles(files);
      setLoading(false);

    } catch (error) {
      console.error('Greška pri učitavanju platnih lista:', error);
      setError('Greška pri učitavanju platnih lista iz Google Drive');
      setLoading(false);
    }
  };

  // Fallback mock podatci za testiranje
  const loadMockData = () => {
    const mockFiles = [
      {
        id: '1',
        month: '01/2025',
        fileName: '01/2025.pdf',
        fileId: 'mock_file_id_1',
        downloadUrl: '#',
        uploadDate: '2025-01-15T10:30:00.000Z',
        size: '245 KB'
      },
      {
        id: '2', 
        month: '02/2025',
        fileName: '02/2025.pdf',
        fileId: 'mock_file_id_2',
        downloadUrl: '#',
        uploadDate: '2025-02-15T10:30:00.000Z',
        size: '251 KB'
      },
      {
        id: '3',
        month: '03/2025', 
        fileName: '03/2025.pdf',
        fileId: 'mock_file_id_3',
        downloadUrl: '#',
        uploadDate: '2025-03-15T10:30:00.000Z',
        size: '238 KB'
      }
    ];

    setTimeout(() => {
      setPayrollFiles(mockFiles);
      setLoading(false);
    }, 1000);
  };

  // Preuzmi platnu listu
  const downloadPayroll = async (file) => {
    try {
      setDownloading(file.id);
      
      // Provjeri da li je mock podatak
      if (file.fileId.startsWith('mock_')) {
        // Simuliraj download za mock podatke
        await new Promise(resolve => setTimeout(resolve, 2000));
        setToast({
          open: true,
          type: 'info',
          message: `Mock preuzimanje ${file.fileName} - Google Drive API nije konfigurisan`
        });
      } else {
        // Koristi Google Drive servis za pravo preuzimanje
        await googleDriveService.downloadFile(file.fileId, file.fileName);
        setToast({
          open: true,
          type: 'success',
          message: `Platna lista ${file.month} je uspješno preuzeta!`
        });
      }
      
    } catch (error) {
      console.error('Greška pri preuzimanju:', error);
      setToast({
        open: true,
        type: 'error',
        message: 'Greška pri preuzimanju platne liste'
      });
    } finally {
      setDownloading(null);
    }
  };

  // Prikaži PDF u viewer-u
  const viewPayroll = (file) => {
    let pdfUrl;
    
    if (file.fileId.startsWith('mock_')) {
      // Za demo, koristi lokalni sample PDF
      pdfUrl = '/bde-evidencija/sample-payroll.pdf';
    } else {
      // Za Google Drive, UVEK koristi preview URL (ne download URL)
      pdfUrl = `https://drive.google.com/file/d/${file.fileId}/preview`;
    }
    
    setPdfViewer({
      isOpen: true,
      url: pdfUrl,
      fileName: file.fileName
    });
  };

  // Formatiranje datuma
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="payroll-screen">
        <div className="payroll-loading">
          <LoadingSpinner />
          <p>Učitavam platne liste...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payroll-screen">
        <div className="payroll-error">
          <div className="error-icon">⚠️</div>
          <h2>Greška</h2>
          <p>{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payroll-screen">
      {/* Header */}
      <div className="payroll-header">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Nazad
        </button>
        
        <div className="header-info">
          <h1>💰 Platne Liste</h1>
          <p>Vozač: <strong>{user?.name}</strong> ({user?.username})</p>
        </div>
      </div>

      {/* Payroll Files List */}
      <div className="payroll-content">
        {payrollFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>Nema dostupnih platnih lista</h3>
            <p>Trenutno nema uploadovanih platnih lista za vaš ID vozača.</p>
          </div>
        ) : (
          <div className="payroll-grid">
            {payrollFiles.map((file) => (
              <div key={file.id} className="payroll-card">
                <div className="card-header">
                  <div className="month-badge">
                    {file.month}
                  </div>
                  <div className="file-size">
                    {file.size}
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="file-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  
                  <div className="file-info">
                    <h3>{file.fileName}</h3>
                    <p>Uploaded: {formatDate(file.uploadDate)}</p>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    className="view-button"
                    onClick={() => viewPayroll(file)}
                    title="Prikaži PDF"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Prikaži
                  </button>
                  
                  <button 
                    className={`download-button ${downloading === file.id ? 'downloading' : ''}`}
                    onClick={() => downloadPayroll(file)}
                    disabled={downloading === file.id}
                  >
                    {downloading === file.id ? (
                      <>
                        <LoadingSpinner size="small" />
                        Preuzimam...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Preuzmi
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast notifications */}
      {toast.open && (
        <Toast
          isOpen={toast.open}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, open: false })}
        />
      )}

      {/* PDF Viewer */}
      <PDFViewer
        pdfUrl={pdfViewer.url}
        fileName={pdfViewer.fileName}
        isVisible={pdfViewer.isOpen}
        onClose={() => setPdfViewer({ isOpen: false, url: null, fileName: null })}
      />
    </div>
  );
}

export default PayrollScreen;