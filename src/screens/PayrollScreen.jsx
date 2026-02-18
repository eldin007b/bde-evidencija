import { motion } from "framer-motion";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Download, FileText, Calendar, User } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/shared/Toast';
import { supabase } from '../db/supabaseClient'; // Putanja koju si potvrdio
import { useUserContext } from '../context/UserContext';

/**
 * PayrollScreen - Pregled platnih lista iz Supabase DB i Storage-a
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

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.driverRole === 'admin' || user.isAdmin) {
      setError('Admini nemaju pristup platnim listama');
      setLoading(false);
      return;
    }

    // Koristimo ili username ili driverName ovisno o tome šta tvoj Context šalje
    const dName = user.username || user.driverName || window.localStorage.getItem('DRIVER_NAME');
    
    if (!dName) {
      setError('Ime vozača nije pronađeno.');
      setLoading(false);
      return;
    }

    fetchInitialData(dName.trim());
  }, [user, navigate]);

  const fetchInitialData = async (name) => {
    try {
      setLoading(true);
      // 1. Dohvati info o vozaču (za turu)
      const { data: dData } = await supabase
        .from('drivers')
        .select('ime, tura')
        .eq('ime', name)
        .eq('deleted', 0)
        .single();
      
      if (dData) setDriverInfo(dData);

      // 2. Dohvati liste iz TABELE 'payrolls' (gdje je upisana 2026)
      const { data: pData, error: pError } = await supabase
        .from('payrolls')
        .select('*')
        .eq('driver_name', name.toLowerCase());

      if (pError) throw pError;

      // Mapiranje podataka za UI
      const formatted = (pData || []).map(item => ({
        id: item.id,
        name: item.file_name,
        // Pravimo labelu "01/2026" iz naziva fajla "01_2026.pdf"
        displayMonth: item.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/'),
        created_at: item.created_at,
        size: 'PDF'
      }));

      // Sortiranje: najnovija godina i mjesec na vrh
      const sorted = formatted.sort((a, b) => {
        const parse = (f) => {
          const m = f.name.match(/(\d{2})_(\d{4})/);
          return m ? { y: parseInt(m[2]), m: parseInt(m[1]) } : { y: 0, m: 0 };
        };
        const bD = parse(b);
        const aD = parse(a);
        return bD.y !== aD.y ? bD.y - aD.y : bD.m - aD.m;
      });

      setPayrollFiles(sorted);
    } catch (err) {
      console.error('Greška:', err);
      setError('Nije moguće učitati platne liste.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPayroll = async (file) => {
    try {
      setDownloading(file.id);
      const folder = (user.username || user.driverName).toLowerCase();
      
      const { data, error } = await supabase.storage
        .from('payroll-lists') // Provjeri da li je bucket 'payrolls' ili 'payroll-lists'
        .download(`${folder}/${file.name}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({ open: true, type: 'success', message: 'Uspješno preuzeto!' });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Greška pri preuzimanju.' });
    } finally {
      setDownloading(null);
    }
  };

  const viewPayroll = async (file) => {
    try {
      const folder = (user.username || user.driverName).toLowerCase();
      const { data, error } = await supabase.storage
        .from('payroll-lists')
        .createSignedUrl(`${folder}/${file.name}`, 60);

      if (error) throw error;

      setPdfViewer({ isOpen: true, url: data.signedUrl, fileName: file.name });
    } catch (err) {
      setToast({ open: true, type: 'error', message: 'Nije moguće prikazati PDF.' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
    <div>
      <h2 className="text-xl font-bold mb-4">{error}</h2>
      <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-4 py-2 rounded">Nazad</button>
    </div>
  </div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-600"><ArrowLeft /></button>
          <div>
            <h1 className="text-2xl font-bold">Platne Liste</h1>
            <p className="text-gray-500">Vozač: <strong>{driverInfo?.ime || user?.username}</strong></p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto p-6">
        {payrollFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>Nema dostupnih lista (uključujući 2026).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payrollFiles.map((file) => (
              <motion.div key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {file.displayMonth}
                  </div>
                  <span className="text-xs text-gray-400">{file.size}</span>
                </div>
                <h3 className="font-semibold mb-4 truncate">{file.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => viewPayroll(file)} className="flex-1 flex items-center justify-center gap-2 bg-gray-50 py-2 rounded-lg text-sm"><Eye size={16}/> Prikaži</button>
                  <button onClick={() => downloadPayroll(file)} className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 py-2 rounded-lg text-sm"><Download size={16}/> Preuzmi</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {pdfViewer.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{pdfViewer.fileName}</h3>
              <button onClick={() => setPdfViewer({ isOpen: false })} className="text-2xl">&times;</button>
            </div>
            <iframe src={pdfViewer.url} className="flex-1 w-full rounded-b-2xl" />
          </div>
        </div>
      )}

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}

export default PayrollScreen;
