import React, { useState, useEffect } from 'react';

/**
 * PDFViewer - Komponenta za prikazivanje PDF fajlova u aplikaciji
 * Podržava Google Drive URL-ove i blob podatke
 */
function PDFViewer({ pdfUrl, fileName, onClose, isVisible }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (isVisible && pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl, isVisible]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      // Ako je URL lokalni blob, koristi direktno
      if (pdfUrl.startsWith('blob:')) {
        setPdfBlob(pdfUrl);
        setLoading(false);
        return;
      }

      // Za vanjski PDF, koristi PDF.js viewer ili Google PDF viewer
      let viewerUrl = pdfUrl;
      
      // Google Drive specijalno rukovanje
      if (pdfUrl.includes('drive.google.com')) {
        // Ako je već preview URL, koristi direktno
        if (pdfUrl.includes('/preview')) {
          viewerUrl = pdfUrl;
        }
        // Ako je download URL, konvertuj u preview
        else {
          const fileIdMatch = pdfUrl.match(/id=([a-zA-Z0-9-_]+)/);
          if (fileIdMatch) {
            const fileId = fileIdMatch[1];
            viewerUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          }
        }
      }
      // Ako je lokalni PDF, koristi direktno
      else if (pdfUrl.startsWith('/')) {
        viewerUrl = pdfUrl;
      }
      // Za druge vanjski URL-ove, pokušaj direktno bez PDF.js
      else if (pdfUrl.startsWith('http')) {
        viewerUrl = pdfUrl;
      }

      setPdfBlob(viewerUrl);
      setLoading(false);

    } catch (error) {
      console.error('Greška pri učitavanju PDF-a:', error);
      setError('Greška pri učitavanju PDF fajla');
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (pdfUrl && !downloading) {
      try {
        setDownloading(true);
        
        // Ako je Google Drive URL, koristi API za direktni download
        if (pdfUrl.includes('drive.google.com')) {
          let fileId = null;
          
          // Izvuci file ID iz različitih Google Drive URL formata
          if (pdfUrl.includes('/preview')) {
            const previewMatch = pdfUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)\/preview/);
            if (previewMatch) fileId = previewMatch[1];
          } else {
            const downloadMatch = pdfUrl.match(/id=([a-zA-Z0-9-_]+)/);
            if (downloadMatch) fileId = downloadMatch[1];
          }
          
          if (fileId) {
            // Koristi Google Drive API sa API key za direktni pristup
            const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
            if (apiKey) {
              const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
              
              const response = await fetch(apiUrl);
              if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName || 'dokument.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(url);
                setDownloading(false);
                return;
              }
            }
          }
        }
        
        // Fallback na osnovni download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName || 'dokument.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloading(false);
        
      } catch (error) {
        console.error('Download error:', error);
        setDownloading(false);
        // Final fallback
        window.open(pdfUrl, '_blank');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      // Za Google Drive fajlove, koristi view URL
      let openUrl = pdfUrl;
      if (pdfUrl.includes('drive.google.com')) {
        const fileIdMatch = pdfUrl.match(/id=([a-zA-Z0-9-_]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          openUrl = `https://drive.google.com/file/d/${fileId}/view`;
        }
      }
      window.open(openUrl, '_blank');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="pdf-viewer-overlay">
      <div className="pdf-viewer-modal">
        {/* Header */}
        <div className="pdf-viewer-header">
          <div className="pdf-file-info">
            <div className="pdf-icon">📄</div>
            <div className="pdf-title">
              <h3>{fileName || 'PDF Dokument'}</h3>
              <p>PDF Viewer</p>
            </div>
          </div>
          
          <div className="pdf-actions">
            <button 
              className="pdf-action-btn open-btn"
              onClick={handleOpenInNewTab}
              title="Otvori u novom tabu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
            
            <button 
              className={`pdf-action-btn download-btn ${downloading ? 'downloading' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
              title="Preuzmi PDF"
            >
              {downloading ? (
                <>
                  <div className="spinner-small"></div>
                  Preuzimam...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Preuzmi
                </>
              )}
            </button>
            
            <button 
              className="pdf-action-btn close-btn"
              onClick={onClose}
              title="Zatvori"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="pdf-viewer-content">
          {loading && (
            <div className="pdf-loading">
              <div className="spinner"></div>
              <p>Učitavam PDF...</p>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <div className="error-icon">⚠️</div>
              <h3>Greška pri učitavanju</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={loadPDF}>
                Pokušaj ponovo
              </button>
            </div>
          )}

          {!loading && !error && pdfBlob && (
            <div className="pdf-container">
              {/* Glavni iframe za PDF */}
              <iframe
                src={pdfBlob}
                className="pdf-iframe"
                title={fileName || 'PDF Dokument'}
                frameBorder="0"
                onLoad={(e) => {
                  setLoading(false);
                }}
                onError={(e) => {
                  // Pokušaj sa direktnim download link-om
                  if (pdfUrl.includes('drive.google.com') && !pdfBlob.includes('/preview')) {
                    const fileIdMatch = pdfUrl.match(/id=([a-zA-Z0-9-_]+)/);
                    if (fileIdMatch) {
                      const fileId = fileIdMatch[1];
                      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
                      setPdfBlob(directUrl);
                      return;
                    }
                  }
                  setError('PDF se nije mogao učitati. Molimo koristite Download dugme.');
                  setLoading(false);
                }}
                style={{ display: 'block' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;