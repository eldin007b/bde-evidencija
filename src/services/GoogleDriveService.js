/**
 * Google Drive API Service - Za pristup platnim listama
 * Struktura foldera: Platne liste/{vozac_id}/{PDF fajlovi}
 */

class GoogleDriveService {
  constructor() {
    this.API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    this.FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
    this.BASE_URL = 'https://www.googleapis.com/drive/v3';
  }

  /**
   * Dohvati sve platne liste za određenog vozača
   */
  async getPayrollFiles(driverId) {
    try {
      // 1. Najdi folder vozača
      const driverFolderId = await this.findDriverFolder(driverId);
      if (!driverFolderId) {
        return [];
      }

      // 2. Dohvati sve fajlove iz foldera
      const files = await this.getFilesInFolder(driverFolderId);
      
      // 3. Filtriraj samo PDF fajlove
      const payrollFiles = [];
      
      for (const file of files) {
        if (file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Izvuci mjesec iz imena fajla (npr. "01-2025.pdf" -> "01/2025")
          const monthMatch = file.name.match(/(\d{2})-(\d{4})/);
          const month = monthMatch ? `${monthMatch[1]}/${monthMatch[2]}` : file.name.replace('.pdf', '');
          
          const payrollFile = {
            id: file.id,
            month: month,
            fileName: file.name,
            fileId: file.id,
            downloadUrl: this.getDownloadUrl(file.id),
            uploadDate: file.modifiedTime,
            size: this.formatFileSize(file.size)
          };
          
          payrollFiles.push(payrollFile);
        }
      }

      return payrollFiles.sort((a, b) => b.month.localeCompare(a.month));
      
    } catch (error) {
      console.error('Greška pri dohvaćanju platnih lista:', error);
      return [];
    }
  }

  /**
   * Najdi folder vozača po ID-u
   */
  async findDriverFolder(driverId) {
    try {
      const query = `'${this.FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${driverId}'`;
      
      const response = await fetch(
        `${this.BASE_URL}/files?q=${encodeURIComponent(query)}&key=${this.API_KEY}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Drive API error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.files.length > 0 ? data.files[0].id : null;
      
    } catch (error) {
      console.error('Greška pri traženju foldera vozača:', error);
      return null;
    }
  }

  /**
   * Dohvati sve fajlove u folderu
   */
  async getFilesInFolder(folderId) {
    try {
      const query = `'${folderId}' in parents and trashed=false`;
      
      const response = await fetch(
        `${this.BASE_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime)&key=${this.API_KEY}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Files API error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.files || [];
      
    } catch (error) {
      console.error('Greška pri dohvaćanju fajlova:', error);
      return [];
    }
  }

  /**
   * Generiraj download URL za fajl
   */
  getDownloadUrl(fileId) {
    // Koristi API poziv sa API key za direktni pristup
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${this.API_KEY}`;
  }

  /**
   * Formatiraj veličinu fajla
   */
  formatFileSize(bytes) {
    if (!bytes) return 'Nepoznato';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Download fajla
   */
  async downloadFile(fileId, fileName) {
    try {
      console.log('Downloading file:', fileId, fileName);
      
      // Koristi API endpoint za direktni download bez autentifikacije
      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${this.API_KEY}`;
      
      // Fetch fajl kao blob
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        // Fallback na osnovni Google Drive link
        const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        window.open(fallbackUrl, '_blank');
        return;
      }
      
      const blob = await response.blob();
      
      // Kreiraj download link sa blob-om
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Očisti blob URL
      window.URL.revokeObjectURL(url);
      
      console.log('File downloaded successfully:', fileName);
      
    } catch (error) {
      console.error('Greška pri downloadu fajla:', error);
      // Fallback na osnovni Google Drive link
      const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      console.log('Using fallback download URL:', fallbackUrl);
      window.open(fallbackUrl, '_blank');
    }
  }
}

const googleDriveService = new GoogleDriveService();

export default googleDriveService;