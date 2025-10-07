import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styles from './ExtraRidesScreen.module.css';
import useDrivers from '../hooks/useDrivers';
import { supabase } from '../db/supabaseClient';
import { format } from 'date-fns';
import stopPrices from '../db/adresaPrices.js';
import plzPrices from '../db/plzPrices.js';
import ModernModal from '../components/common/ModernModal';
import MonthYearPicker from '../components/shared/MonthYearPicker';
import DriverPicker from '../components/shared/DriverPicker';
import { IconCar, IconStats, IconCalendar, IconUser, IconDriver, IconLocation, IconNumber, IconRoute, IconMoney, IconPending, IconApproved, IconTotal } from '../components/common/Icons';

export default function ExtraRidesScreen() {
  const { drivers } = useDrivers();

  // state
  const initSelected = () => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('bde_current_user') : null;
      if (s) {
        const u = JSON.parse(s);
        if (u?.name) return u.name;
      }
      const t = typeof window !== 'undefined' ? localStorage.getItem('DRIVER_TURA') : null;
      if (t && drivers && drivers.length) {
        const m = drivers.find(d => d.tura === t);
        if (m) return m.ime;
      }
    } catch {}
    return '';
  };
  const [selectedDriver, setSelectedDriver] = useState(initSelected);
  const autoSelectedRef = useRef(false);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tura, setTura] = useState('');
  const [plz, setPlz] = useState('');
  const [brojAdresa, setBrojAdresa] = useState('');
  const [cijena, setCijena] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [rides, setRides] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [approvedSum, setApprovedSum] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailRide, setDetailRide] = useState(null);

  // filteri
  const [filterDriver, setFilterDriver] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [isDriverPickerOpen, setIsDriverPickerOpen] = useState(false);

  // Sync selected driver with logged-in user; ignore any old manual selections
  useEffect(() => {
    // clear any stale manual selection key from older versions
    try { localStorage.removeItem('EXTRA_SELECTED_DRIVER'); } catch {}
    if (!drivers || drivers.length === 0) return;
    const getUserFromStorage = () => {
      try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; }
    };
    const u = getUserFromStorage();
    let nextName = '';
    if (u?.name) {
      nextName = u.name;
    } else {
      const t = localStorage.getItem('DRIVER_TURA');
      const byTura = t ? drivers.find(d => d.tura === t) : null;
      if (byTura) nextName = byTura.ime;
    }
    if (nextName && nextName !== selectedDriver) {
      setSelectedDriver(nextName);
    }
    autoSelectedRef.current = true;
  }, [drivers]);

  // dropdown opcije: svi vozači + ulogovani (ako ga nema iz nekog razloga)
  const optionDrivers = useMemo(() => {
    const all = drivers ? [...drivers] : [];
    const currentUser = (() => { try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; } })();
    const current = currentUser?.username ? all.find(d => d.tura === currentUser.username) : null;
    const list = current ? [current, ...all] : all;
    const seen = new Set();
    const deduped = list.filter(d => {
      const key = d.tura || d.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sortiraj prioritetne ture prvo
    const priority = ['8610', '8620', '8630', '8640'];
    deduped.sort((a, b) => {
      const ai = priority.indexOf(String(a.tura));
      const bi = priority.indexOf(String(b.tura));
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      // fallback: po tura pa ime
      const ta = String(a.tura || '');
      const tb = String(b.tura || '');
      const cmp = ta.localeCompare(tb, undefined, { numeric: true });
      if (cmp !== 0) return cmp;
      return String(a.ime || '').localeCompare(String(b.ime || ''), undefined, { sensitivity: 'base' });
    });
    
    // Dodaj "Svi vozači" opciju na početak
    return [{ ime: '', tura: 'ALL' }, ...deduped];
  }, [drivers]);

  // fetch vožnje
  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0);
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');

      const { data: approved } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('date', from).lte('date', to).eq('status', 'approved');

      const { data: pending } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from).lte('date', to).eq('status', 'pending');

      let allApproved = approved || [];
      let allPending = pending || [];

      if (filterDriver) {
        allApproved = allApproved.filter(r => r.driver === filterDriver);
        allPending = allPending.filter(r => r.driver === filterDriver);
      }

      const all = [
        ...allPending.map(r => ({ ...r, status: 'pending' })),
        ...allApproved.map(r => ({ ...r, status: 'approved' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setRides(all);
      setPendingCount(allPending.length);
      setApprovedCount(allApproved.length);
      setApprovedSum(allApproved.reduce((s, r) => s + (r.cijena || 0), 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterYear, filterMonth, filterDriver]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  // kalkulacija cijene
  useEffect(() => {
    const adresaNum = parseInt(brojAdresa);
    const plzNum = parseInt(plz);
    const adresaCijena = (!isNaN(adresaNum) && stopPrices[adresaNum]) ? stopPrices[adresaNum] : 0;
    const plzCijena = (!isNaN(plzNum) && plzPrices[plzNum]) ? plzPrices[plzNum] : 0;
    setCijena(adresaCijena + plzCijena);
  }, [brojAdresa, plz]);

  // submit
  const handleSubmit = async () => {
    if (!selectedDriver || !date || !tura || !plz || !brojAdresa) {
      alert('Unesite sve podatke!');
      return;
    }
    setSubmitting(true);
    try {
      const currentUser = (() => { try { return JSON.parse(localStorage.getItem('bde_current_user') || 'null'); } catch { return null; } })();
      const adresaNum = parseInt(brojAdresa);
      const plzNum = parseInt(plz);
      const adresaPrice = stopPrices[adresaNum] || 0;
      const plzPrice = plzPrices[plzNum] || 0;

      const rideData = {
        driver: selectedDriver,
        date,
        tura,
        plz,
        broj_adresa: adresaNum,
        cijena,
        plz_price: plzPrice,
        adresa_price: adresaPrice,
        // auditable/required fields
        action: 'create',
        created_by: currentUser?.username || tura || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('extra_rides_pending').insert([rideData]);
      if (error) throw error;

      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTura(''); setPlz(''); setBrojAdresa(''); setCijena(0);
      // fokus na Tura nakon uspješnog dodavanja
      if (turaRef.current) {
        turaRef.current.focus();
      }
      fetchRides();
      alert('Vožnja dodana!');
    } catch (err) {
      alert('Greška: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ref za fokus na Tura input
  const turaRef = useRef(null);

  return (
    <div className={styles.extraRidesScreen}>
      <div className={styles.mainGrid}>
        {/* 🎯 Header sa naslovom i statistikama */}
        <div className={styles.headerCard}>
          <div className={styles.heroSection}>
            <h1 className={styles.heroTitle}>Posebne vožnje</h1>
          </div>
          
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <IconPending size={22} />
                </div>
                <div className={styles.statValue}>{pendingCount}</div>
                <div className={styles.statLabel}>Na čekanju</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <IconApproved size={22} />
                </div>
                <div className={styles.statValue}>{approvedCount}</div>
                <div className={styles.statLabel}>Odobreno</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <IconTotal size={22} />
                </div>
                <div className={styles.statValue}>{approvedSum.toFixed(0)}€</div>
                <div className={styles.statLabel}>Ukupan iznos</div>
              </div>
            </div>
          </div>
        </div>

        {/* 🎛️ Form za dodavanje */}
        <div className={styles.controlsCard}>
          <div className={styles.formContainer}>
            {/* Prvi red: Datum i Vozač */}
            <div className={styles.formRowTwo}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconCalendar size={16} />
                  Datum
                </div>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconDriver size={16} />
                  Vozač
                </div>
                <input 
                  type="text" 
                  value={selectedDriver || ''} 
                  disabled 
                  placeholder="Ulogovani vozač"
                  className={styles.formInput}
                />
              </div>
            </div>
            
            {/* Ostala polja - jedno ispod drugog */}
            <div className={styles.formRowSingle}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconRoute size={16} />
                  Tura
                </div>
                <input 
                  ref={turaRef}
                  type="number" 
                  placeholder="4 broja" 
                  min="1000"
                  max="9999"
                  value={tura} 
                  onChange={e => {
                    const value = e.target.value;
                    if (value.length <= 4) {
                      setTura(value);
                    }
                  }}
                  onInput={e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formRowSingle}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconLocation size={16} />
                  PLZ
                </div>
                <input 
                  type="number" 
                  placeholder="4 broja" 
                  min="1000"
                  max="9999"
                  value={plz} 
                  onChange={e => {
                    const value = e.target.value;
                    // Ograniči na maksimalno 4 cifre
                    if (value.length <= 4) {
                      setPlz(value);
                    }
                  }}
                  onInput={e => {
                    // Ukloni sve što nije broj
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formRowSingle}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconNumber size={16} />
                  Broj adresa
                </div>
                <input 
                  type="number" 
                  placeholder="20-120" 
                  min="20"
                  max="120"
                  value={brojAdresa} 
                  onChange={e => {
                    const value = e.target.value;
                    if (value.length <= 3) {
                      setBrojAdresa(value);
                    }
                  }}
                  onInput={e => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                  }}
                  className={styles.formInput}
                />
              </div>
            </div>
            
            <div className={styles.formRowSingle}>
              <div className={styles.filterGroup}>
                <div className={styles.priceLabel}>
                  <IconMoney size={18} />
                  Cena: <span className={styles.priceAmount}>{cijena.toFixed(0)}€</span>
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={submitting}
                  className={styles.submitButton}
                >
                  {submitting ? 'Dodajem...' : 'Dodaj vožnju'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 Data Table */}
        <div className={styles.dataCard}>
          {/* Filteri iznad tabele */}
          <div className={styles.filtersContainer}>
            <div className={styles.filterHeader}>
              <h3 className={styles.filterTitle}>🔍 Filtriranje</h3>
            </div>
            <div className={styles.filtersRow}>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconUser size={16} />
                  Vozač
                </div>
                <div className={styles.driverPickerWrapper}>
                  <div 
                    className={styles.driverDisplay}
                    onClick={() => setIsDriverPickerOpen(true)}
                  >
                    {filterDriver ? 
                      `${filterDriver} (${optionDrivers.find(d => d.ime === filterDriver)?.tura || ''})` 
                      : 'Svi vozači'
                    }
                  </div>
                  {isDriverPickerOpen && (
                    <DriverPicker
                      selectedDriver={filterDriver}
                      onDriverChange={(driver) => {
                        setFilterDriver(driver);
                        setIsDriverPickerOpen(false);
                      }}
                      drivers={optionDrivers}
                      onClose={() => setIsDriverPickerOpen(false)}
                    />
                  )}
                </div>
              </div>
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  <IconCalendar size={16} />
                  Mesec
                </div>
                <div className={styles.monthYearPickerWrapper}>
                  <MonthYearPicker
                    month={filterMonth}
                    year={filterYear}
                    onMonthChange={setFilterMonth}
                    onYearChange={setFilterYear}
                    className={styles.monthYearPicker}
                  />
                  <div className={styles.monthYearDisplay}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'][filterMonth]} {filterYear}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <IconStats size={24} />
                Učitavanje...
              </div>
            ) : rides.length === 0 ? (
              <div className={styles.emptyState}>
                <IconCar size={48} />
                <h3>Nema vožnji</h3>
                <p>Dodajte prvu posebnu vožnju iznad.</p>
              </div>
            ) : (
              <div className={styles.ridesGrid}>
                {rides.map((r, i) => (
                  <div key={i} className={styles.rideCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardDate}>
                        <IconCalendar size={18} />
                        <span>{format(new Date(r.date), 'dd.MM.yyyy')}</span>
                      </div>
                      <div className={
                        r.status === 'approved' ? styles.statusBadgeApproved :
                        r.status === 'rejected' ? styles.statusBadgeRejected :
                        styles.statusBadgePending
                      }>
                        {r.status === 'approved' ? (
                          <>
                            <IconApproved size={16} />
                            <span>Odobreno</span>
                          </>
                        ) : r.status === 'rejected' ? (
                          <>
                            <IconPending size={16} />
                            <span>Odbačeno</span>
                          </>
                        ) : (
                          <>
                            <IconPending size={16} />
                            <span>Na čekanju</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.cardPrice}>
                      <IconMoney size={24} />
                      <span className={styles.priceAmount}>{r.cijena}€</span>
                    </div>
                    
                    <div className={styles.cardInfo}>
                      <div className={styles.infoRowTop}>
                        <div className={styles.infoItem}>
                          <IconDriver size={16} />
                          <span>{r.driver}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <IconRoute size={16} />
                          <span>{r.tura}</span>
                        </div>
                      </div>
                      <div className={styles.infoRowBottom}>
                        <div className={styles.infoItem}>
                          <IconLocation size={16} />
                          <span>{r.plz}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <IconNumber size={16} />
                          <span>{r.broj_adresa}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal detalji */}
        <ModernModal
          visible={!!detailRide}
          onClose={() => setDetailRide(null)}
          title="Detalji vožnje"
          icon={<IconCar size={24} />}
        >
          {detailRide && (
            <div style={{ padding: 20, display: 'grid', gap: 10 }}>
              <div><strong>Datum:</strong> {format(new Date(detailRide.date), 'dd.MM.yyyy')}</div>
              <div><strong>Vozač:</strong> {detailRide.driver}</div>
              <div><strong>Tura:</strong> {detailRide.tura}</div>
              <div><strong>PLZ:</strong> {detailRide.plz}</div>
              <div><strong>Broj adresa:</strong> {detailRide.broj_adresa}</div>
              <div><strong>Cena:</strong> {Number(detailRide.cijena).toFixed(0)} €</div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={
                  detailRide.status === 'approved' ? styles.statusApproved :
                  detailRide.status === 'rejected' ? styles.statusRejected :
                  styles.statusPending
                }>
                  {detailRide.status === 'approved' ? '✅ Odobreno' :
                   detailRide.status === 'rejected' ? '❌ Odbačeno' :
                   '⏳ Na čekanju'}
                </span>
              </div>
            </div>
          )}
        </ModernModal>
      </div>
  );
}
