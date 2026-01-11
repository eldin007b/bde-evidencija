import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Vrlo jednostavno upravljanje: ti unosiš status po danu.
 * PDF generiše tabelu u obliku službenog obrasca.
 *
 * Kasnije se može dodati automatsko popunjavanje iz baze,
 * ali ovako dobiješ 100% kontrolu i 1:1 identičnost.
 */

const DEFAULT_DRIVER = 'Arnes Hokic'; // može i Denis
const DEFAULT_MONTH = '12';
const DEFAULT_YEAR = '2025';

// statusi koji se ubacuju u tabelu
const STATUS_OPTIONS = ['RAD', 'URLAUB', '—'];

export default function WorktimeTab() {
  const [image, setImage] = useState(null);
  const [driver, setDriver] = useState(DEFAULT_DRIVER);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);

  // radna tabela po danima (1-based)
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  // inicijalno popuni sa —
  const [rows, setRows] = useState(
    Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      status: '—'
    }))
  );

  // kad promijeniš mjesec ili godinu, resetuje table ili možeš zadržati
  const handleMonthChange = (m) => {
    setMonth(m);
    const newDays = new Date(Number(year), Number(m), 0).getDate();
    setRows((prev) => {
      // ako se broj dana promijeni, resetujemo ili skratimo / produžimo
      if (newDays === prev.length) return prev;
      const arr = [];
      for (let i = 0; i < newDays; i++) {
        arr.push(prev[i] || { day: i + 1, status: '—' });
      }
      return arr;
    });
  };

  const handleYearChange = (y) => {
    setYear(y);
    const newDays = new Date(Number(y), Number(month), 0).getDate();
    setRows((prev) => {
      if (newDays === prev.length) return prev;
      const arr = [];
      for (let i = 0; i < newDays; i++) {
        arr.push(prev[i] || { day: i + 1, status: '—' });
      }
      return arr;
    });
  };

  const handleStatusChange = (index, value) => {
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === index
          ? {
              ...r,
              status: value
            }
          : r
      )
    );
  };

  // generiše grupu za PDF; vrijedi pravilo:
  // RAD → 05:30–14:00, 8h, Ladezeit 3h
  // URLAUB → sve —
  // — → sve —
  const getRowData = (status, day) => {
    if (status === 'RAD') {
      return [
        day,
        'RAD',
        '05:30',
        '11:30–12:00',
        '14:00',
        '8',
        '3'
      ];
    }
    // za URLAUB i —
    return [day, status, '—', '—', '—', '—', '—'];
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');

    // Naslov
    pdf.setFontSize(14);
    pdf.text('Arbeitszeitaufzeichnungen', 105, 15, { align: 'center' });

    // Info vozač i mjesec
    pdf.setFontSize(10);
    pdf.text(`Nachname und Vorname: ${driver}`, 14, 25);
    pdf.text(`Monat / Jahr: ${month}.${year}`, 14, 31);

    // Tabela
    const tableRows = rows.map(r => getRowData(r.status, r.day));

    autoTable(pdf, {
      startY: 38,
      head: [
        [
          'Tag',
          'Status',
          'Arbeitsbeginn',
          'Pause',
          'Arbeitsende',
          'Stunden',
          'Ladezeit'
        ]
      ],
      body: tableRows,
      styles: {
        fontSize: 9,
        halign: 'center'
      },
      headStyles: {
        fillColor: [30, 64, 175] // tamnoplava glava (možeš prilagoditi)
      }
    });

    // prostor za ukupno sate? može se dodat ovdje ako želiš
    // ili ako ţeliš Summit ukupno, možeš izračunati sumu sati RAD
    // npr:
    // const totalHours = rows.reduce((sum, r) => (r.status === 'RAD' ? sum + 8 : sum), 0);

    // Potpisi
    let finalY = pdf.lastAutoTable.finalY + 10;
    pdf.text('__________________________', 14, finalY);
    pdf.text('Unterschrift Fahrer', 14, finalY + 6);
    pdf.text('__________________________', 14, finalY + 16);
    pdf.text('Unterschrift Firma', 14, finalY + 22);

    // Ako je uploadana slika, stavi je na novu stranicu kao dokaz
    if (image) {
      pdf.addPage();
      pdf.setFontSize(12);
      pdf.text('Screenshot – Lieferübersicht (Nachweis)', 14, 15);
      // Širina slike 190mm, visinu auto. Ovdje možeš prilagoditi
      pdf.addImage(image, 'JPEG', 10, 25, 190, 0);
    }

    // Spremi
    const safeName = driver.replace(/[^a-zA-Z0-9_-]/g, '_');
    pdf.save(`Arbeitszeit_${safeName}_${month}_${year}.pdf`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000 }}>
      <h2 style={{ marginBottom: 12 }}>🕒 Evidencija rada – upload screenshot + PDF</h2>

      {/* 1) Izbor vozača, mjeseca, godine */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <select value={driver} onChange={e => setDriver(e.target.value)} style={{ padding: '6px 10px' }}>
          <option>Arnes Hokic</option>
          <option>Denis Frelih</option>
        </select>

        <input
          type="number"
          value={month}
          onChange={e => handleMonthChange(e.target.value)}
          placeholder="MM"
          style={{ width: 60, padding: '6px 10px' }}
        />

        <input
          type="number"
          value={year}
          onChange={e => handleYearChange(e.target.value)}
          placeholder="YYYY"
          style={{ width: 80, padding: '6px 10px' }}
        />
      </div>

      {/* 2) Upload screenshot */}
      <div style={{ marginBottom: 16 }}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
      </div>

      {/* 3) Preview screenshot */}
      {image && (
        <div style={{ marginBottom: 20 }}>
          <img
            src={image}
            alt="Preview"
            style={{ maxWidth: '100%', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          />
        </div>
      )}

      {/* 4) Tabela za ručno popunjavanje statusa */}
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: 6, background: '#f3f3f3' }}>Dan</th>
              <th style={{ border: '1px solid #ccc', padding: 6, background: '#f3f3f3' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.day}>
                <td style={{ border: '1px solid #ccc', padding: 6, textAlign: 'center' }}>{r.day}</td>
                <td style={{ border: '1px solid #ccc', padding: 6 }}>
                  <select
                    value={r.status}
                    onChange={e => handleStatusChange(idx, e.target.value)}
                    style={{ padding: '4px 8px' }}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5) Dugme za PDF */}
      <button
        onClick={generatePDF}
        style={{
          padding: '10px 18px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        📄 Generiši PDF i preuzmi
      </button>
    </div>
  );
}
