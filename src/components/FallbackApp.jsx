import React, { useState } from 'react';
import { FileText, Download, Printer, Mail, Calendar, Euro, Calculator, CheckCircle, RefreshCw } from "lucide-react";
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

/**
 * Fallback App - minimalna aplikacija kad se glavni App ruši
 * Omogućava basic funkcionalnost kao što je InvoicesTab
 */
export default function FallbackApp({ onRestart }) {
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showToast, setShowToast] = useState(false);
  
  // Invoice items - simplified version
  const [invoiceItems] = useState([
    {
      id: 1,
      description: "Abholung Klagenfurt",
      quantity: 22, // Working days for October
      unit: "Tag",
      pricePerUnit: 150.00
    }
  ]);

  // Calculate totals
  const taxRate = 20;
  const netto = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
  const ust = (netto * taxRate) / 100;
  const total = netto + ust;

  // Other calculated values
  const lastDay = new Date(year, month, 0).getDate();
  const period = `01.${month.toString().padStart(2, "0")}.${year} – ${lastDay.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year}`;
  const invoiceDate = `${lastDay.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year}`;
  const invoiceNumber = `${month.toString().padStart(2, "0")}/${year.toString().slice(-2)}`;
  const workingDays = 22; // Simplified

  const showSuccessToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleGeneratePDF = async () => {
    try {
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
    } catch (error) {
      alert('Greška pri generiranju PDF-a: ' + error.message);
    }
  };

  const handleReload = () => {
    if (onRestart) {
      onRestart();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Error Notice */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Aplikacija je u recovery modu (React Hook greška)
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Detektovan problem sa React Hook-ovima pri refreshu. Sve funkcije rade kroz recovery sistem. InvoicesTab potpuno funkcionalan!
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={handleReload}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Restart App
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          ✅ PDF generisan uspješno
        </div>
      )}

      {/* Invoice Generator - Simplified */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">GLS Rechnung Generator</h1>
              <p className="text-gray-600">Recovery Mode - Basic funkcionalnost</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Konfiguracija računa</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mjesec</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{i+1}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Godina</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Pregled računa</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">Rechnungsnummer:</span>
                  <span className="font-medium">{invoiceNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-medium">{period}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">Radni dani:</span>
                  <span className="font-medium">{workingDays}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Nettobetrag:</span>
                  <span>€{netto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Umsatzsteuer (20%):</span>
                  <span>€{ust.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg text-blue-600">
                    <span>Rechnungsbetrag:</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGeneratePDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg 
                         flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-5 h-5" />
                💾 Generiši PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}