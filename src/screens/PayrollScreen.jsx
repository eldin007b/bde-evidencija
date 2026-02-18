import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './PayrollScreen.css';

function PayrollScreen({ user }) {
  const [payrollFiles, setPayrollFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.username) {
      loadPayrollFiles(user.username);
    }
  }, [user]);

  const loadPayrollFiles = async (driverUsername) => {
    try {
      setLoading(true);
      setError(null);

      // Dohvaćamo podatke iz tabele 'payrolls' za konkretnog vozača
      const { data, error: dbError } = await supabase
        .from('payrolls')
        .select('*')
        .eq('driver_name', driverUsername.toLowerCase());

      if (dbError) throw dbError;

      // Sortiramo po 'created_at' tako da 2026. bude na vrhu
      const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Mapiramo podatke u format koji tvoja tabela već koristi
      const formattedFiles = sortedData.map(item => ({
        id: item.id,
        // Pretvara "01_2026.pdf" u "01/2026" za prikaz
        month: item.file_name.replace('.pdf', '').replace('.PDF', '').replace('_', '/'),
        fileName: item.file_name,
        fileId: item.id, // Koristimo ID iz baze
        uploadDate: item.created_at,
        size: 'PDF' // Pojednostavljeno jer nemamo podatak o veličini u bazi
      }));

      setPayrollFiles(formattedFiles);
    } catch (err) {
      console.error('Greška:', err);
      setError('Nije moguće učitati platne liste.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileName) => {
    try {
      // Putanja do fajla u storage-u: username/file_name
      const filePath = `${user.username.toLowerCase()}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('payroll-lists')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Greška pri preuzimanju.');
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Učitavanje...</div>;

  return (
    <div className="payroll-screen">
      <div className="payroll-header">
        <h2>Moje Platne Liste</h2>
        <p>Pregled i preuzimanje vaših mjesečnih obračuna</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payroll-table-container">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Mjesec/Godina</th>
              <th>Tip dokumenta</th>
              <th>Datum objave</th>
              <th>Akcija</th>
            </tr>
          </thead>
          <tbody>
            {payrollFiles.map((file) => (
              <tr key={file.id}>
                <td className="font-bold">{file.month}</td>
                <td>{file.size}</td>
                <td>{new Date(file.uploadDate).toLocaleDateString('de-DE')}</td>
                <td>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(file.fileName)}
                  >
                    Preuzmi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayrollScreen;
s
