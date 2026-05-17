import React, { useState, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import { generateInvoicePDF } from "../../utils/generateInvoicePDF";
import { FileText, Download, Printer, Mail, Calendar, Euro, Calculator, CheckCircle, Plus, X } from "lucide-react";
import { motion } from "framer-motion";

export default function InvoicesTab() {
  // 1. PROMJENA: Postavi trenutni mjesec i godinu automatski
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [taxRate, setTaxRate] = useState(20);
  const [showToast, setShowToast] = useState(false);

  // 🔹 Array of invoice items (stavke)
  const [invoiceItems, setInvoiceItems] = useState([
    {
      id: 1,
      description: "Abholung Klagenfurt",
      quantity: 0, // Inicijalno 0, useEffect će ovo odmah ažurirati
      unit: "Tour",
      pricePerUnit: 150.00
    }
  ]);

  // Show toast notification
  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 2. PROMJENA: Prvo samo izračunaj dane (čista matematika)
  const workingDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
    }
    return count;
  }, [month, year]);

  // 3. PROMJENA: Ažuriraj stavku SAMO kada se promijeni mjesec (workingDays)
  // Ovo omogućava da ručno izmijeniš broj (npr. 22), a da se on ne vrati na 21 
  // osim ako ponovno ne promijeniš mjesec.
  useEffect(() => {
    setInvoiceItems(prev => prev.map((item, index) => 
      index === 0 ? { ...item, quantity: workingDays } : item 
    ));
  }, [workingDays]);


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
    // Sigurnije generisanje ID-a
    const maxId = invoiceItems.length > 0 ? Math.max(...invoiceItems.map(item => item.id)) : 0;
    const newId = maxId + 1;
    
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
      workingDays, // Šaljemo izračunate dane kao info
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
    const body = `Poštovani,

u prilogu se nalazi račun za period ${period}.

Ukupan iznos: €${total.toFixed(
      2
    )}

Srdačan pozdrav,
B&D Kleintransporte KG`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mjesečni obračun</h2>
          <p className="text-gray-500 mt-1">Generisanje računa za GLS Austria</p>
        </div>
        
        {/* Actions Bar */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleGeneratePDF}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleSendEmail}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Mail size={18} />
            <span className="hidden sm:inline">Email</span>
          </button>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Calendar size={16} /> Mjesec i Godina
          </label>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="flex-1 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {monthNames.map((m, index) => (
                <option key={index} value={index + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-24 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Euro size={16} /> PDV Stopa (%)
          </label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value))}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Calculator size={16} /> Radni Dani (Auto)
          </label>
          <div className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500">
            {workingDays} dana
          </div>
        </div>
      </div>

      {/* Invoice Items Table */}
      <div className="mb-8 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600 w-12">#</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-600">Opis usluge</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 w-24">Količina</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 w-24">Jedinica</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 w-32">Cijena (€)</th>
              <th className="text-right py-3 px-2 text-sm font-semibold text-gray-600 w-32">Ukupno</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoiceItems.map((item, index) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-2 text-sm text-gray-400">{index + 1}</td>
                <td className="py-3 px-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-gray-800 font-medium"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    className="w-full text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none text-gray-500"
                  />
                </td>
                <td className="py-3 px-2">
                  <input
                    type="number"
                    value={item.pricePerUnit}
                    onChange={(e) => updateItem(item.id, "pricePerUnit", parseFloat(e.target.value))}
                    className="w-full text-right bg-transparent border-b border-transparent focus:border-blue-500 outline-none"
                  />
                </td>
                <td className="py-3 px-2 text-right font-medium text-gray-800">
                  €{(item.quantity * item.pricePerUnit).toFixed(2)}
                </td>
                <td className="py-3 px-2 text-center">
                  {invoiceItems.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4">
          <button
            onClick={addItem}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus size={16} />
            Dodaj novu stavku
          </button>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div className="text-sm text-gray-500 max-w-md">
            <p className="mb-2 font-medium text-gray-700">Detalji plaćanja:</p>
            <p>Rok plaćanja: 15 dana</p>
            <p>Račun: {invoiceNumber}</p>
            <p>Datum: {invoiceDate}</p>
          </div>
          
          <div className="w-full md:w-80 space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Neto iznos:</span>
              <span>€{netto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>PDV ({taxRate}%):</span>
              <span>€{ust.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between text-xl font-bold text-gray-800">
              <span>Ukupno:</span>
              <span className="text-blue-600">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50"
        >
          <CheckCircle className="text-green-400" size={20} />
          <span>Račun uspješno generisan!</span>
        </motion.div>
      )}
    </div>
  );
}
