import React, { useState } from "react";
import Tesseract from "tesseract.js";
import { Upload, Printer, Calendar } from "lucide-react";

const WORKDAY = {
  beginn: "05:30",
  ende: "14:00",
  pause: "11:30–12:00",
  hours: "8",
  ladezeit: "3"
};

export default function WorktimeTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const processImage = async (file) => {
    setLoading(true);
    const url = URL.createObjectURL(file);
    setImage(url);

    const { data } = await Tesseract.recognize(file, "deu+eng");

    const lines = data.text.split("\n");

    const days = [];

    lines.forEach(line => {
      const match = line.match(/^(\d{1,2})\.\s+(Urlaub|–|\d+)/i);
      if (!match) return;

      const day = Number(match[1]);
      const value = match[2];

      if (value.toLowerCase().includes("urlaub")) {
        days.push({ day, type: "URLAUB" });
      } else if (value === "–") {
        days.push({ day, type: "OFF" });
      } else {
        days.push({ day, type: "RAD" });
      }
    });

    setRows(days);
    setLoading(false);
  };

  return (
    <div className="space-y-6">

      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            Evidencija rada (Screenshot → PDF)
          </h2>
        </div>

        <label className="flex items-center gap-3 cursor-pointer text-gray-300">
          <Upload />
          Upload Screenshot (Deliveries)
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => processImage(e.target.files[0])}
          />
        </label>

        {loading && <p className="text-yellow-400 mt-3">⏳ OCR obrada…</p>}
        {image && <img src={image} className="mt-4 rounded-xl border border-gray-700 max-h-64" />}
      </div>

      {rows.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <table className="w-full text-white text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th>Tag</th>
                <th>Status</th>
                <th>Beginn</th>
                <th>Pause</th>
                <th>Ende</th>
                <th>Std</th>
                <th>Ladezeit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.day} className="border-b border-gray-800">
                  <td className="text-center">{r.day}</td>

                  {r.type === "RAD" && (
                    <>
                      <td>RAD</td>
                      <td>{WORKDAY.beginn}</td>
                      <td>{WORKDAY.pause}</td>
                      <td>{WORKDAY.ende}</td>
                      <td>{WORKDAY.hours}</td>
                      <td>{WORKDAY.ladezeit}</td>
                    </>
                  )}

                  {r.type === "URLAUB" && (
                    <>
                      <td colSpan="5">URLAUB</td>
                      <td>0</td>
                      <td>—</td>
                    </>
                  )}

                  {r.type === "OFF" && (
                    <>
                      <td colSpan="6">—</td>
                      <td>—</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={() => window.print()}
            className="mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 rounded-xl font-bold"
          >
            <Printer className="inline mr-2" />
            Print / Save PDF
          </button>
        </div>
      )}
    </div>
  );
}
