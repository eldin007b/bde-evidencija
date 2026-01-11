import React, { useState } from "react";
import { Upload, Printer, Calendar, Loader2 } from "lucide-react";

/**
 * FIX:
 * Tesseract se učitava PREKO CDN-a
 * (Vite + PWA build SAFE)
 */
function loadTesseract() {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve(window.Tesseract);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/tesseract.js@5.0.4/dist/tesseract.min.js";
    script.async = true;

    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error("Tesseract not available"));
    };

    script.onerror = () => reject(new Error("Failed to load Tesseract"));
    document.body.appendChild(script);
  });
}

const WORKDAY = {
  beginn: "05:30",
  pause: "11:30–12:00",
  ende: "14:00",
  hours: "8",
  ladezeit: "3"
};

export default function WorktimeTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const processImage = async (file) => {
    setLoading(true);
    setError(null);
    setRows([]);
    setImagePreview(URL.createObjectURL(file));

    try {
      const Tesseract = await loadTesseract();

      const { data } = await Tesseract.recognize(file, "deu+eng");
      const lines = data.text.split("\n");

      const parsed = [];

      lines.forEach((line) => {
        const clean = line.replace(/\s+/g, " ").trim();
        const match = clean.match(/^(\d{1,2})\.\s*(Urlaub|urlaub|–|-|\d+)/);
        if (!match) return;

        const day = Number(match[1]);
        const value = match[2].toLowerCase();

        if (value.includes("urlaub")) {
          parsed.push({ day, type: "URLAUB" });
        } else if (value === "-" || value === "–") {
          parsed.push({ day, type: "OFF" });
        } else {
          parsed.push({ day, type: "RAD" });
        }
      });

      parsed.sort((a, b) => a.day - b.day);
      setRows(parsed);
    } catch (e) {
      console.error(e);
      setError("OCR greška – provjeri screenshot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            Evidencija rada (Screenshot → PDF)
          </h2>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          Automatski Arbeitszeitaufzeichnung – 1:1 kao službeni PDF
        </p>
      </div>

      {/* UPLOAD */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer text-gray-300">
          <Upload className="w-5 h-5" />
          Upload deliveries screenshot
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => processImage(e.target.files[0])}
          />
        </label>

        {loading && (
          <div className="flex items-center gap-2 mt-4 text-yellow-400">
            <Loader2 className="animate-spin" />
            OCR obrada…
          </div>
        )}

        {error && <div className="mt-4 text-red-400">{error}</div>}

        {imagePreview && (
          <img
            src={imagePreview}
            className="mt-4 rounded-xl border border-gray-700 max-h-64"
          />
        )}
      </div>

      {/* TABLE */}
      {rows.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 overflow-x-auto">
          <table className="w-full text-sm text-white">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-2">Dan</th>
                <th>Status</th>
                <th>Početak</th>
                <th>Pauza</th>
                <th>Kraj</th>
                <th>Sati</th>
                <th>Ladezeit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.day} className="border-b border-gray-700">
                  <td className="text-center p-2">{r.day}</td>

                  {r.type === "RAD" ? (
                    <>
                      <td className="text-center">RAD</td>
                      <td className="text-center">{WORKDAY.beginn}</td>
                      <td className="text-center">{WORKDAY.pause}</td>
                      <td className="text-center">{WORKDAY.ende}</td>
                      <td className="text-center">{WORKDAY.hours}</td>
                      <td className="text-center">{WORKDAY.ladezeit}</td>
                    </>
                  ) : r.type === "URLAUB" ? (
                    <>
                      <td className="text-center font-bold">URLAUB</td>
                      <td colSpan="4" className="text-center">—</td>
                      <td className="text-center">0</td>
                      <td className="text-center">—</td>
                    </>
                  ) : (
                    <>
                      <td colSpan="6" className="text-center">—</td>
                      <td className="text-center">—</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 rounded-xl font-bold"
            >
              <Printer className="w-5 h-5" />
              Print / Save PDF
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
