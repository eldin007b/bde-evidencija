import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, RefreshCw, Sun, Palmtree, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../../db/supabaseClient';

const FALLBACK_DRIVERS = [
  { id: '8610', name: '8610' },
  { id: '8620', name: '8620' },
  { id: '8630', name: '8630' },
  { id: '8640', name: '8640' },
];

export default function UrlaubTab({ drivers: driversFromProps }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [urlaubList, setUrlaubList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const driversList = (Array.isArray(driversFromProps) && driversFromProps.length > 0)
    ? driversFromProps
        .filter(d => d && d.aktivan)
        .map(d => ({ id: String(d.tura), name: d.ime }))
    : FALLBACK_DRIVERS;
  
  // Form state
  const [selectedDriver, setSelectedDriver] = useState('8620');
  const [selectedDate, setSelectedDate] = useState('');
  const [targetDriver, setTargetDriver] = useState('8610');
  const [transferStatus, setTransferStatus] = useState(null);

  // Dohvati praznike iz baze (holidays tabela)
  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('date, name')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .eq('deleted', 0)
        .order('date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (err) {
      console.error('Greška pri dohvaćanju praznika:', err);
      setHolidays([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Dohvati urlaub listu iz baze (urlaub_marks tabela)
  const fetchUrlaubList = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('urlaub_marks')
        .select('*')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .eq('is_active', true)
        .order('date', { ascending: true });

      if (error) throw error;
      setUrlaubList(data || []);
    } catch (err) {
      console.error('Greška pri dohvaćanju urlaub liste:', err);
      setUrlaubList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchUrlaubList();
  }, [fetchUrlaubList]);

  // Dodaj urlaub i prebaci podatke
  const handleAddUrlaub = async () => {
    if (!selectedDate || !selectedDriver || !targetDriver) {
      alert('Molimo odaberite datum, vozača i ciljnog vozača.');
      return;
    }

    if (selectedDriver === targetDriver) {
      alert('Vozač i ciljni vozač ne mogu biti isti.');
      return;
    }

    setSaving(true);
    setTransferStatus(null);

    try {
      // 1. Provjeri da li već postoji urlaub za taj datum i vozača
      const { data: existing } = await supabase
        .from('urlaub_marks')
        .select('id')
        .eq('date', selectedDate)
        .eq('driver', selectedDriver)
        .eq('is_active', true)
        .single();

      if (existing) {
        alert('Urlaub za ovaj datum i vozača već postoji.');
        setSaving(false);
        return;
      }

      // 2. Dohvati podatke vozača za taj datum
      const { data: sourceData, error: sourceError } = await supabase
        .from('deliveries')
        .select('*')
        .eq('date', selectedDate)
        .eq('driver', selectedDriver)
        .eq('deleted', 0);

      if (sourceError) throw sourceError;

      let transferredCount = 0;

      if (sourceData && sourceData.length > 0) {
        // Prvo provjeri da li ciljni vozač već ima podatke za taj datum (samo jednom)
        const { data: targetRows } = await supabase
          .from('deliveries')
          .select('id, zustellung_paketi, produktivitaet_stops')
          .eq('date', selectedDate)
          .eq('driver', targetDriver)
          .eq('deleted', 0);

        const targetExisting = targetRows && targetRows.length > 0 ? targetRows[0] : null;

        // Izračunaj ukupne vrijednosti za prebacivanje
        let totalPaketi = 0;
        let totalStops = 0;

        for (const row of sourceData) {
          totalPaketi += Number(row.zustellung_paketi) || 0;
          totalStops += Number(row.produktivitaet_stops) || 0;

          // Označi originalni red kao obrisan (soft delete)
          const { error: deleteError } = await supabase
            .from('deliveries')
            .update({ deleted: 1 })
            .eq('id', row.id);

          if (deleteError) throw deleteError;
          transferredCount++;
        }

        // Sada prebaci podatke na ciljnog vozača
        if (targetExisting) {
          // Saberi vrijednosti sa postojećim
          const { error: updateError } = await supabase
            .from('deliveries')
            .update({
              zustellung_paketi: (Number(targetExisting.zustellung_paketi) || 0) + totalPaketi,
              produktivitaet_stops: (Number(targetExisting.produktivitaet_stops) || 0) + totalStops,
            })
            .eq('id', targetExisting.id);

          if (updateError) throw updateError;
        } else {
          // Kreiraj novi red za ciljnog vozača - koristi upsert umjesto insert
          const { error: upsertError } = await supabase
            .from('deliveries')
            .upsert({
              date: selectedDate,
              driver: targetDriver,
              zustellung_paketi: totalPaketi,
              produktivitaet_stops: totalStops,
              deleted: 0,
            }, { onConflict: 'date,driver' });

          if (upsertError) throw upsertError;
        }
      }

      // 5. Upiši urlaub u tabelu urlaub_marks
      const driverName = driversList.find(d => d.id === selectedDriver)?.name || selectedDriver;
      const targetDriverName = driversList.find(d => d.id === targetDriver)?.name || targetDriver;

      const { error: urlaubError } = await supabase
        .from('urlaub_marks')
        .insert({
          date: selectedDate,
          driver: selectedDriver,
          target_driver: targetDriver,
          is_active: true,
        });

      if (urlaubError) throw urlaubError;

      setTransferStatus({
        success: true,
        message: `Urlaub dodan. ${transferredCount} zapisa prebačeno sa ${driverName} (${selectedDriver}) na ${targetDriverName} (${targetDriver}).`
      });

      // Refresh liste
      fetchUrlaubList();
      setSelectedDate('');

    } catch (err) {
      console.error('Greška pri dodavanju urlauba:', err);
      setTransferStatus({
        success: false,
        message: `Greška: ${err.message}`
      });
    } finally {
      setSaving(false);
    }
  };

  // Deaktiviraj urlaub (soft delete - ne vraća podatke nazad)
  const handleDeleteUrlaub = async (urlaubId) => {
    if (!confirm('Jeste li sigurni? Ovo neće vratiti prebačene podatke.')) return;

    try {
      const { error } = await supabase
        .from('urlaub_marks')
        .update({ is_active: false })
        .eq('id', urlaubId);

      if (error) throw error;
      fetchUrlaubList();
    } catch (err) {
      console.error('Greška pri brisanju urlauba:', err);
      alert('Greška pri brisanju: ' + err.message);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
            <Palmtree className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Urlaub & Praznici</h2>
            <p className="text-gray-400 text-sm">Upravljanje godišnjim odmorima i austrijskim praznicima</p>
          </div>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-amber-500 focus:outline-none"
        >
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lijeva strana - Dodaj Urlaub */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            Dodaj Urlaub
          </h3>

          <div className="space-y-4">
            {/* Datum */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Datum</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Vozač na Urlaubu */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vozač na Urlaubu</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-amber-500 focus:outline-none"
              >
                {driversList.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </div>

            {/* Prebaci podatke na */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Prebaci podatke na</label>
              <select
                value={targetDriver}
                onChange={(e) => setTargetDriver(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-amber-500 focus:outline-none"
              >
                {driversList.filter(d => d.id !== selectedDriver).map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.id})</option>
                ))}
              </select>
            </div>

            {/* Transfer info */}
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Svi podaci (stopovi, paketi, adrese) za odabrani datum će biti prebačeni na ciljnog vozača.</span>
            </div>

            {/* Status */}
            {transferStatus && (
              <div className={`p-3 rounded-lg ${transferStatus.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                {transferStatus.message}
              </div>
            )}

            {/* Dugme */}
            <button
              onClick={handleAddUrlaub}
              disabled={saving || !selectedDate}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Dodaj Urlaub i Prebaci Podatke
                </>
              )}
            </button>
          </div>

          {/* Lista Urlauba */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              Urlaub Lista ({selectedYear})
            </h4>
            
            {loading ? (
              <div className="text-center py-4 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : urlaubList.length === 0 ? (
              <p className="text-gray-500 text-sm">Nema upisanih urlauba za {selectedYear}.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {urlaubList.map((u) => {
                  const driverInfo = driversList.find(d => d.id === u.driver);
                  const targetInfo = driversList.find(d => d.id === u.target_driver);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <Palmtree className="w-4 h-4 text-amber-400" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {driverInfo?.name || u.driver} ({u.driver})
                          </p>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            {formatDate(u.date)}
                            <ArrowRight className="w-3 h-3" />
                            {targetInfo?.name || u.target_driver} ({u.target_driver})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUrlaub(u.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Desna strana - Austrijski praznici */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 text-yellow-400" />
            Austrijski Praznici ({selectedYear})
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {holidays.map((h, idx) => {
              const isPast = new Date(h.date) < new Date();
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isPast 
                      ? 'bg-gray-900/30 border-gray-800 opacity-60' 
                      : 'bg-yellow-900/20 border-yellow-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className={`w-4 h-4 ${isPast ? 'text-gray-500' : 'text-yellow-400'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isPast ? 'text-gray-400' : 'text-white'}`}>
                        {h.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatDate(h.date)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-400">
              <strong className="text-gray-300">Napomena:</strong> Praznici se učitavaju iz baze podataka (holidays tabela).
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
