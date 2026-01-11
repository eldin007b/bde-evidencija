import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WorktimeTab() {
  const [image, setImage] = useState(null);
  const [driver, setDriver] = useState('Arnes Hokic');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState('2025');

  // RUČNO – 100% KONTROLA (isti model kao PDF)
  // ovo kasnije možeš puniti iz baze ako želiš
  const STATUS_BY_DAY = {
    24: 'URLAUB',
    29: 'URLAUB',
    31: 'URLAUB'
  };

  const DAYS_IN_MONTH = new Date(year, month, 0).getDate();

  const getRowForDay = (day) => {
    const status = STATUS_BY_DAY[day] || 'RAD';

    if (status === 'URLAUB') {
      return [day, 'URLAUB', '—', '—', '—', '—', '—'];
    }

    return [
      day,
      'RAD',
      '05:30',
      '11:30–12:00',
      '14:00',
      '8',
      '3'
    ];
  };

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');

    pdf.setFontSize(14);
    pdf.text('Arbeitszeitaufzeichnung', 105, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.text(`Mitarbeiter: ${driver}`, 14, 25);
    pdf.text(`Monat / Jahr: ${month}.${year}`, 14, 31);

    const tableRows = [];
    for (let d = 1; d <= DAYS_IN_MONTH; d++) {
      tableRows.push(getRowForDay(d));
    }

    autoTable(pdf, {
      startY: 38,
      head: [[
        'Tag',
        'Status',
        'Beginn',
        'Pause',
        'Ende',
        'Stunden',
        'Ladezeit'
      ]],
      body: tableRows,
      styles: {
        fontSize: 9,
        halign: 'center'
      },
      headStyles: {
        fillColor: [30, 64, 175]
      }
    });

    let finalY = pdf.lastAutoTable.finalY + 10;

    pdf.text('Unterschrift Mitarbeiter: _______________________', 14, finalY);
    pdf.text('Unterschrift Firma: ___________________________', 14, finalY + 10);

    if (image) {
      pdf.addPage();
      pdf.setFontSize(12);
      pdf.text('Screenshot – Lieferübersicht (Nachweis)', 14, 15);
      pdf.addImage(image, 'JPEG', 10, 25, 190, 0);
    }

    pdf.save(`Arbeitszeit_${driver.replaceAll(' ', '_')}_${month}_${year}.pdf`);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🕒 Evidencija rada (PDF)</h2>

      <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
        <select value={driver} onChange={e => setDriver(e.target.value)}>
          <option>Arnes Hokic</option>
          <option>Denis Frelih</option>
        </select>

        <input value={month} onChange={e => setMonth(e.target.value)} placeholder="MM" />
        <input value={year} onChange={e => setYear(e.target.value)} placeholder="YYYY" />
      </div>

      <input type="file" accept="image/*" onChange={handleImageUpload} />

      {image && (
        <div style={{ marginTop: 15 }}>
          <img src={image} alt="preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      <button
        onClick={generatePDF}
        style={{
          marginTop: 20,
          padding: '10px 20px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 'bold'
        }}
      >
        📄 Generiši PDF
      </button>
    </div>
  );
}
