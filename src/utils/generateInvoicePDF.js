import { jsPDF } from "jspdf";

export const generateInvoicePDF = async ({
  month,
  year,
  taxRate,
  invoiceItems,
  workingDays,
  period,
  invoiceDate,
  invoiceNumber,
  netto,
  ust,
  total,
}) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = 25;

  // 🔹 HEADER - Rechnung title with teal color and logo area
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(23, 162, 184); // Teal color
  doc.text("Rechnung", 20, y);

  // 🔹 Add logo (right side)
  try {
    // Load logo from public assets
    const logoResponse = await fetch('/bde-evidencija/assets/logo.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoDataUrl = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(logoBlob);
      });
      
      // Add logo with proper sizing - wider for better proportions
      const logoWidth = 60;  // Increased width
      const logoHeight = 20; // Adjusted height to maintain aspect ratio
      const logoX = pageWidth - logoWidth - 15;
      const logoY = y - 15;
      
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } else {
      throw new Error('Logo not found');
    }
  } catch (error) {
    // Fallback if logo can't be loaded
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 123, 191); // Blue color
    doc.text("B & D", pageWidth - 50, y - 5);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("KLEINTRANSPORTE KG", pageWidth - 50, y + 5);
  }

  // 🔹 Teal line under header
  doc.setDrawColor(23, 162, 184);
  doc.setLineWidth(2);
  doc.line(20, y + 8, pageWidth - 20, y + 8);

  y += 25;

  // 🔹 COMPANY INFO - Left side
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("B&D Kleintransporte KG", 20, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Adolf-Tschabuschnigg-Straße 19/3", 20, y);
  
  y += 5;
  doc.text("9020 Klagenfurt", 20, y);
  
  y += 5;
  doc.text("Österreich", 20, y);

  // 🔹 INVOICE INFO - Right side with proper spacing
  const rightX = pageWidth - 80;
  y -= 16;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Rechnungsdatum:", rightX, y);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceDate, rightX + 35, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Rechnungsnummer:", rightX, y);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceNumber, rightX + 35, y);

  y += 20;

  // 🔹 EMPFÄNGER section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Empfänger:", 20, y);
  
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("General Logistics Systems", 20, y);
  
  y += 5;
  doc.text("Austria GmbH", 20, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Depot 57", 20, y);
  
  y += 5;
  doc.text("Industriestr. 30", 20, y);
  
  y += 5;
  doc.text("9586 Fürnitz", 20, y);
  
  y += 5;
  doc.text("Österreich", 20, y);

  y += 20;

  // 🔹 ZUSÄTZLICHE INFORMATIONEN section
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Zusätzliche Informationen", 20, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Leistungszeitraum: ${period}`, 20, y);

  // 🔹 Teal line above table
  y += 10;
  doc.setDrawColor(23, 162, 184);
  doc.setLineWidth(1);
  doc.line(20, y, pageWidth - 20, y);

  y += 8;

  // 🔹 TABLE HEADERS
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  
  const tableHeaders = ["Bezeichnung", "Anzahl", "Einheit", "Preis", "Ust. %", "Ust", "Gesamt"];
  const colWidths = [45, 20, 20, 25, 18, 25, 30];
  let x = 20;

  tableHeaders.forEach((header, i) => {
    if (i === 0) {
      doc.text(header, x, y);
    } else {
      doc.text(header, x, y, { align: "center" });
    }
    x += colWidths[i];
  });

  y += 6;

  // 🔹 TABLE ROWS - Multiple items support
  doc.setFont("helvetica", "normal");
  
  invoiceItems.forEach((item, index) => {
    x = 20;
    const itemTotal = item.quantity * item.pricePerUnit;
    const itemUst = (itemTotal * taxRate) / 100;
    const itemGesamt = itemTotal + itemUst;
    
    const rowData = [
      item.description,
      item.quantity.toString(),
      item.unit,
      `${item.pricePerUnit.toFixed(2)} €`,
      `${taxRate}%`,
      `${itemUst.toFixed(2)} €`,
      `${itemGesamt.toFixed(2)} €`
    ];

    rowData.forEach((cell, i) => {
      if (i === 0) {
        doc.text(cell, x, y);
      } else {
        doc.text(cell, x, y, { align: "center" });
      }
      x += colWidths[i];
    });

    y += 6;
  });

  y += 10;

  // 🔹 SUMMARY SECTION - Right aligned like in original
  const summaryX = pageWidth - 80;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Nettobetrag", summaryX, y);
  doc.text(`${netto.toFixed(2)} €`, summaryX + 50, y, { align: "right" });
  
  y += 6;
  doc.text("Umsatzsteuer", summaryX, y);
  doc.text(`${ust.toFixed(2)} €`, summaryX + 50, y, { align: "right" });
  
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(23, 162, 184); // Teal color for final amount
  doc.text("Rechnungsbetrag", summaryX, y);
  doc.text(`${total.toFixed(2)} €`, summaryX + 50, y, { align: "right" });

  y += 20;

  // 🔹 PAYMENT CONDITIONS
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Zahlungsbedingungen: Zahlung innerhalb von 15 Tagen ab Rechnungseingang ohne Abzüge.", 20, y);
  
  y += 5;
  doc.text("Bei Rückfragen stehen wir selbstverständlich jederzeit gerne zur Verfügung.", 20, y);

  // 🔹 FOOTER SECTION with company details
  y = pageHeight - 40;
  
  // Company details in three columns
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("B&D Kleintransporte KG", 20, y);
  doc.text("Kontaktinformation", 80, y);
  doc.text("Bankverbindung", 140, y);
  
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Adolf-Tschabuschnigg-Straße 19/3", 20, y);
  doc.text("Katarina Begic", 80, y);
  doc.text("Bank Name        Sparkasse Bank", 140, y);
  
  y += 4;
  doc.text("9020 Klagenfurt", 20, y);
  doc.text("Phone: +43664174173", 80, y);
  doc.text("IBAN              AT50 2070 6046 0015 6403", 140, y);
  
  y += 4;
  doc.text("Österreich", 20, y);
  doc.text("Email: transportklagenfurt@gmail.com", 80, y);
  doc.text("SWIFT/BIC        KSPKAT2KXXX", 140, y);
  
  y += 4;
  doc.text("ATU78339513 - FN 537160t", 20, y);

  // 🔹 Bottom teal bar
  y += 8;
  doc.setFillColor(23, 162, 184);
  doc.rect(20, y, pageWidth - 40, 5, 'F');

  // 🔹 Spremi PDF
  const filename = `GLS Rechnung ${month.toString().padStart(2, "0")}.${year}.pdf`;
  doc.save(filename);
};