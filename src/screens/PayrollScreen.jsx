
import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, FileText, Calendar, User } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/shared/Toast';
import PDFViewer from '../components/common/PDFViewer';
import { getPayrollFiles, downloadPayrollFile } from '../services/SupabasePayrollService';
import { supabase } from '../db/supabaseClient';
import { useUserContext } from '../context/UserContext';

/**
 * PayrollScreen - Pregled i preuzimanje platnih lista za vozače
 * Platne liste se čuvaju u Supabase Storage bucket 'payrolls'
 */
function PayrollScreen() {
  const user = useUserContext();
  const navigate = useNavigate();
  const [payrollFiles, setPayrollFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', type: 'info' });
  const [error, setError] = useState(null);
  const [pdfViewer, setPdfViewer] = useState({ isOpen: false, url: null, fileName: null });
  const [driverInfo, setDriverInfo] = useState(null);

  // Učitaj platne liste za vozača
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    // Provjeri da li je vozač
    if (user.driverRole === 'admin' || user.isAdmin) {
      setError('Admini nemaju pristup platnim listama');
      setLoading(false);
      return;
    }
    // Ako nema ime vozača, ne učitavaj platne liste
    if (!user.driverName) {
      setLoading(false);
      return;
    }
    // Dohvati podatke o vozaču iz Supabase
    const fetchDriverInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('ime, tura')
          .eq('ime', user.driverName.trim())
          .eq('deleted', 0)
          .single();
        if (!error && data) {
          setDriverInfo(data);
        }
      } catch (err) {
        // ignoriraj grešku
      }
    };
    fetchDriverInfo();
    loadPayrollFiles(user.driverName.trim().toLowerCase());
  }, [user, navigate]);
  // Fallback forma za unos imena vozača
  const [inputDriverName, setInputDriverName] = useState('');
  const handleDriverNameSubmit = (e) => {
    e.preventDefault();
    if (inputDriverName.trim().length < 3) {
      setError('Unesite puno ime vozača (min 3 slova)');
      return;
    }
    window.localStorage.setItem('DRIVER_NAME', inputDriverName.trim());
    if (typeof user.refreshStatus === 'function') user.refreshStatus();
    setError(null);
    setInputDriverName('');
    setLoading(true);
    // Ponovo učitaj platne liste
    loadPayrollFiles(inputDriverName.trim().toLowerCase());
  };

  // Učitaj platne liste iz Supabase Storage
  const loadPayrollFiles = async (driverId) => {
    try {
      setLoading(true);
      const files = await getPayrollFiles(driverId);
      setPayrollFiles(files);
      setLoading(false);
    } catch (error) {
      console.error('Greška pri učitavanju platnih lista:', error);
      setError('Greška pri učitavanju platnih lista iz Supabase Storage');
      setLoading(false);
    }
  };



  // Preuzmi platnu listu
  const downloadPayroll = async (file) => {
    try {
      setDownloading(file.id);
      const folder = driverInfo?.ime ? driverInfo.ime.trim().toLowerCase() : user.driverName.trim().toLowerCase();
      await downloadPayrollFile(folder, file.name || file.fileName);
      setToast({
        open: true,
        type: 'success',
        message: `Platna lista ${file.name || file.fileName} je uspješno preuzeta!`
      });
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
  const viewPayroll = async (file) => {
    const folder = driverInfo?.ime ? driverInfo.ime.trim().toLowerCase() : user.driverName.trim().toLowerCase();
    console.log('[viewPayroll] folder:', folder, 'file:', file.name);
    const { data, error } = await supabase
      .storage
      .from('payrolls')
      .createSignedUrl(`${folder}/${file.name}`, 60);
    console.log('[viewPayroll] Supabase result:', { data, error });
    const pdfUrl = data?.signedUrl;
    if (pdfUrl) {
      setPdfViewer({
        isOpen: true,
        url: pdfUrl,
        fileName: file.name
      });
    } else {
      setToast({
        open: true,
        type: 'error',
        message: 'PDF nije pronađen ili nije moguće prikazati.'
      });
    }
  };

  // Formatiranje datuma
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('bs-BA', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  // Sortiraj platne liste po godini i mjesecu silazno
  const sortedPayrollFiles = [...payrollFiles].sort((a, b) => {
    // Podržava formate: 01_2025.pdf, 09_2024.pdf, 12_2026.pdf
    const parse = (file) => {
      // Defensive check: ensure file and file.name exist
      if (!file || !file.name || typeof file.name !== 'string') {
        return { year: 0, month: 0 };
      }
      const match = file.name.match(/(\d{2})_(\d{4})/);
      if (!match) return { year: 0, month: 0 };
      return { year: parseInt(match[2]), month: parseInt(match[1]) };
    };
    const aDate = parse(a);
    const bDate = parse(b);
    if (aDate.year !== bDate.year) return bDate.year - aDate.year;
    return bDate.month - aDate.month;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Učitavam platne liste...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Greška</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/')}
          >
            Nazad na početnu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 p-6"
      >
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Nazad</span>
          </button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Platne Liste
            </h1>
            <p className="text-gray-600 flex items-center gap-2 mt-1">
              <User className="w-4 h-4" />
              Vozač: <strong>{driverInfo?.ime || user?.name || user?.driverName}</strong>
              {driverInfo?.tura ? (
                <span className="text-sm">({driverInfo.tura})</span>
              ) : null}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {payrollFiles.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-sm p-12 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nema dostupnih platnih lista</h3>
            <p className="text-gray-600">Trenutno nema uploadovanih platnih lista za vaš ID vozača.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedPayrollFiles.map((file, index) => (
              <motion.div 
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      {file.month}
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {file.size}
                    </span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">{file.name}</h3>
                    {file.created_at && (
                      <p className="text-sm text-gray-500">
                        Uploaded: {formatDate(file.created_at)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors"
                      onClick={() => viewPayroll(file)}
                      title="Prikaži PDF"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">Prikaži</span>
                    </button>
                    
                    <button 
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                        downloading === file.id 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                      onClick={() => downloadPayroll(file)}
                      disabled={downloading === file.id}
                    >
                      {downloading === file.id ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span className="text-sm">Preuzimam...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Preuzmi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
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
      {pdfViewer.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 relative flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
              onClick={() => setPdfViewer({ isOpen: false, url: null, fileName: null })}
              title="Zatvori"
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">{pdfViewer.fileName || 'PDF Dokument'}</h3>
            <iframe
              src={pdfViewer.url}
              className="w-full h-[70vh] border rounded-lg"
              title={pdfViewer.fileName || 'PDF Dokument'}
              frameBorder="0"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PayrollScreen;
