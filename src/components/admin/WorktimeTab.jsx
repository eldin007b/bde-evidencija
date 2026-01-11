import React, { useState } from "react";
import { Calendar, Upload, Printer, FileText } from "lucide-react";

const DEFAULT_DAY = {
  status: "RAD",
  beginn: "05:30",
  pause: "11:30–12:00",
  ende: "14:00",
  stunden: "8",
  ladezeit: "3"
};

const DAYS_IN_MONTH = (month, year) =>
  new Date(year, month, 0).getDate();

export default function WorktimeTab() {
  const [employee, setEmployee] = useState("Arnes Hokic");
  const [month, setMonth] = useState("12");
  const [year, setYear] = useState("2025");
  const [urlaub, setUrlaub] = useState([24, 29, 31]);
  const [screenshot, setScreenshot] = useState(null);

  const days = DAYS_IN_MONTH(Number(month), Number(year));

  const toggleUrlaub = (day) => {
    setUrlaub((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const printPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">
            Arbeitszeitaufzeichnung
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className="rounded-xl bg-gray-900 text-white px-4 py-3 border border-gray-700"
            placeholder="Mitarbeiter"
          />

          <input
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl bg-gray-900 text-white px-4 py-3 border border-gray-700"
            placeholder="MM"
          />

          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-xl bg-gray-900 text-white px-4 py-3 border border-gray-700"
            placeholder="YYYY"
          />

          <button
            onClick={printPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
          >
            <Printer className="w-5 h-5" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* UPLOAD */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer text-gray-300">
          <Upload className="w-5 h-5" />
          Upload Screenshot (Nachweis)
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setScreenshot(URL.createObjectURL(e.target.files[0]))}
          />
        </label>

        {screenshot && (
          <img
            src={screenshot}
            alt="Screenshot"
            className="mt-4 rounded-xl border border-gray-700 max-h-64"
          />
        )}
      </div>

      {/* TABLE */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 overflow-x-auto">
        <table className="w-full text-sm text-white border-collapse">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="p-2">Tag</th>
              <th>Status</th>
              <th>Beginn</th>
              <th>Pause</th>
              <th>Ende</th>
              <th>Stunden</th>
              <th>Ladezeit</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const isUrlaub = urlaub.includes(day);

              return (
                <tr
                  key={day}
                  onClick={() => toggleUrlaub(day)}
                  className={`cursor-pointer border-b border-gray-700 ${
                    isUrlaub ? "bg-amber-500/20" : ""
                  }`}
                >
                  <td className="p-2 text-center">{day}</td>
                  {isUrlaub ? (
                    <>
                      <td className="text-center font-bold">URLAUB</td>
                      <td colSpan="5" className="text-center">—</td>
                    </>
                  ) : (
                    <>
                      <td className="text-center">RAD</td>
                      <td className="text-center">{DEFAULT_DAY.beginn}</td>
                      <td className="text-center">{DEFAULT_DAY.pause}</td>
                      <td className="text-center">{DEFAULT_DAY.ende}</td>
                      <td className="text-center">{DEFAULT_DAY.stunden}</td>
                      <td className="text-center">{DEFAULT_DAY.ladezeit}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SIGNATURE */}
      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
          <div>
            <p className="mb-2">Unterschrift Mitarbeiter:</p>
            <div className="border-b border-gray-500 h-8" />
          </div>
          <div>
            <p className="mb-2">Unterschrift Firma:</p>
            <div className="border-b border-gray-500 h-8" />
          </div>
        </div>
      </div>

    </div>
  );
}
