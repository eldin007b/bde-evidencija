import React, { useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import { FileText, Download, Printer, Mail, Calendar, Euro, Calculator, CheckCircle, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function InvoicesTab() {
  const [month, setMonth] = useState(10); // October for current invoice
  const [year, setYear] = useState(new Date().getFullYear());
  const [taxRate, setTaxRate] = useState(20);
  const [showToast, setShowToast] = useState(false);
  
  // 🔹 Array of invoice items (stavke)
  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      description: "Abholung Klagenfurt",
      quantity: 22, // Working days will be calculated
      unit: "Tour",
      pricePerUnit: 150.00
    }
  ]);

  // Show toast notification
  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 🔹 Broj radnih dana (pon-pet) - ažuriraj prvi item
  const workingDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    }
    
    // Update first item quantity with working days
    setInvoiceItems(prev => prev.map((item, index) => 
      index === 0 ? { ...item, quantity: count } : item
    ));
    
    return count;
  }, [month, year]);

  // 🔹 Dinamičke vrijednosti
  const lastDay = new Date(year, month, 0).getDate();
  const period = `01.${month.toString().padStart(2, "0")}.${year} – ${lastDay
    .toString()
    .padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year}`;
  const invoiceDate = `${lastDay.toString().padStart(2, "0")}.${month
    .toString()
    .padStart(2, "0")}.${year}`;
  const invoiceNumber = `${month.toString().padStart(2, "0")}/${year
    .toString()
    .slice(-2)}`;

  // 🔹 Izračuni na osnovu svih stavki
  const calculations = useMemo(() => {
    const netto = invoiceItems.reduce((sum, item) => {
      return sum + (item.quantity * item.pricePerUnit);
    }, 0);
    const ust = (netto * taxRate) / 100;
    const total = netto + ust;
    
    return { netto, ust, total };
  }, [invoiceItems, taxRate]);
  
  const { netto, ust, total } = calculations;

  // 🔹 Functions for managing items
  const addItem = () => {
    const newId = Math.max(...invoiceItems.map(item => item.id)) + 1;
    setInvoiceItems([...invoiceItems, {
      id: newId,
      description: "Nova stavka",
      quantity: 1,
      unit: "Tag",
      pricePerUnit: 150.00
    }]);
  };

  const removeItem = (id) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // 🔹 Generiši PDF
  const handleGeneratePDF = async () => {
    await generateInvoicePDF({
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
    });
    showSuccessToast();
  };

  // 🔹 Print
  const handlePrint = async () => {
    await handleGeneratePDF();
    window.print();
  };

  // 🔹 Pošalji email
  const handleSendEmail = () => {
    const firstService = invoiceItems[0]?.description || "GLS Rechnung";
    const subject = `Rechnung ${invoiceNumber} – ${firstService}`;
    const body = `Poštovani,\n\nu prilogu se nalazi račun za period ${period}.\n\nUkupan iznos: €${total.toFixed(
      2
    )}\n\nSrdačan pozdrav,\nB&D Kleintransporte KG`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          ✅ PDF generisan uspješno
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8" />
          <h2 className="text-2xl font-bold">GLS Rechnung Generator</h2>
        </div>
        <p className="text-blue-100">Mjesečni obračun za General Logistics Systems Austria GmbH</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Konfiguracija računa
          </h3>

          {/* Mjesec i godina */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Mjesec
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {monthNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}. {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Godina
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Invoice Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Stavke računa
              </label>
              <button
                onClick={addItem}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                + Dodaj stavku
              </button>
            </div>
            
            {invoiceItems.map((item, index) => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stavka {index + 1}
                  </span>
                  {invoiceItems.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Ukloni
                    </button>
                  )}
                </div>
                
                {/* Description */}
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Opis stavke"
                />
                
                {/* Quantity, Unit, Price */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Količina</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                               focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      disabled={index === 0} // First item quantity is auto-calculated
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Jedinica</label>
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                               focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cijena (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.pricePerUnit}
                      onChange={(e) => updateItem(item.id, 'pricePerUnit', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                               focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  Ukupno: €{(item.quantity * item.pricePerUnit).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* PDV */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                USt. (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Pregled računa
          </h3>

          {/* Podaci o računu */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Leistungszeitraum:</span>
              <span className="font-medium text-gray-900 dark:text-white">{period}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Rechnungsdatum:</span>
              <span className="font-medium text-gray-900 dark:text-white">{invoiceDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Rechnungsnummer:</span>
              <span className="font-medium text-gray-900 dark:text-white">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400">Radni dani:</span>
              <span className="font-medium text-gray-900 dark:text-white">{workingDays}</span>
            </div>
          </div>

          {/* Izračun */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Nettobetrag:</span>
              <span className="font-medium">€{netto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Umsatzsteuer ({taxRate}%):</span>
              <span className="font-medium">€{ust.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <div className="flex justify-between font-bold text-lg text-blue-600 dark:text-blue-400">
                <span>Rechnungsbetrag:</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              onClick={handleGeneratePDF}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                       text-white font-medium px-4 py-3 rounded-lg transition-all duration-200
                       flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              💾 Generiši PDF
            </motion.button>
            
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={handlePrint}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 
                         text-white font-medium px-4 py-2 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Printer className="w-4 h-4" />
                🖨️ Print
              </motion.button>
              
              <motion.button
                onClick={handleSendEmail}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 
                         text-white font-medium px-4 py-2 rounded-lg transition-all duration-200
                         flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                📧 E-mail
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}