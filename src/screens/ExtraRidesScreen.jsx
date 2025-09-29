import React, { useState, useEffect, useCallback } from 'react';
import './ExtraRidesScreen.css';
import useDrivers from '../hooks/useDrivers';
import SkeletonCell from '../components/common/SkeletonCell';
import { supabase } from '../db/supabaseClient';
import { format } from 'date-fns';
import CloseButton from '../components/common/CloseButton.jsx';
import stopPrices from '../db/adresaPrices.js';
import plzPrices from '../db/plzPrices.js';

export default function ExtraRidesScreen() {
  const { drivers } = useDrivers();
  
  // State variables
  const [selectedDriver, setSelectedDriver] = useState('');
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
  
  // Filter state
  const [filterDriver, setFilterDriver] = useState('');
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Auto-select driver from localStorage
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriver) {
      const currentTura = localStorage.getItem('DRIVER_TURA');
      console.log('🔍 Looking for driver with tura:', currentTura);
      
      if (currentTura) {
        // Pronađi vozača sa odgovarajućim tura kodom
        const matchingDriver = drivers.find(driver => driver.tura === currentTura);
        console.log('✅ Matching driver found:', matchingDriver);
        
        if (matchingDriver) {
          setSelectedDriver(matchingDriver.ime);
          console.log('🎯 Auto-selected driver:', matchingDriver.ime);
        } else {
          console.log('❌ No driver found for tura:', currentTura);
          // Fallback - proba da čita iz starog setup-a
          const setupData = localStorage.getItem('bde_app_setup');
          if (setupData) {
            const parsedSetup = JSON.parse(setupData);
            if (parsedSetup.driver) {
              const driverName = parsedSetup.driver.ime || parsedSetup.driver.name;
              setSelectedDriver(driverName);
              console.log('📋 Fallback selected driver:', driverName);
            }
          }
        }
      }
    }
  }, [drivers, selectedDriver]);

  // Fetch rides function
  const fetchRides = useCallback(async () => {
    setLoading(true);
    console.log('🔍 Fetching rides for month:', filterMonth, 'driver:', filterDriver);
    
    try {
      const [year, month] = filterMonth.split('-');
      
      // Koristi date-fns za tačan poslednji dan meseca
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Poslednji dan meseca
      
      const from = format(startDate, 'yyyy-MM-dd');
      const to = format(endDate, 'yyyy-MM-dd');
      
      console.log('📅 Date range:', from, 'to', to);
      
      // Fetch approved extra rides
      const { data: approvedRides, error: approvedError } = await supabase
        .from('extra_rides')
        .select('*')
        .gte('date', from)
        .lte('date', to);

      // Fetch pending extra rides (only pending status)
      const { data: pendingRides, error: pendingError } = await supabase
        .from('extra_rides_pending')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .eq('status', 'pending');

      console.log('✅ Approved rides data:', approvedRides);
      console.log('⏳ Pending rides data:', pendingRides);
      
      if (approvedError) {
        console.error('❌ Error fetching approved rides:', approvedError);
      }
      if (pendingError) {
        console.error('❌ Error fetching pending rides:', pendingError);
      }

      const allApproved = approvedRides || [];
      const allPending = pendingRides || [];

      console.log('📊 Total approved:', allApproved.length, 'Total pending:', allPending.length);

      // Filter by driver if selected
      let filteredApproved = allApproved;
      let filteredPending = allPending;
      if (filterDriver) {
        filteredApproved = allApproved.filter(r => r.driver === filterDriver);
        filteredPending = allPending.filter(r => r.driver === filterDriver);
        console.log('🔍 After driver filter - Approved:', filteredApproved.length, 'Pending:', filteredPending.length);
      }

      // Combine and sort rides
      const allRides = [
        ...filteredPending.map(r => ({ ...r, status: 'pending' })),
        ...filteredApproved.map(r => ({ ...r, status: 'approved' }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('🚗 Combined rides:', allRides);

      setRides(allRides);
      setPendingCount(filteredPending.length);
      setApprovedCount(filteredApproved.length);
      setApprovedSum(filteredApproved.reduce((sum, r) => sum + (r.cijena || 0), 0));

    } catch (error) {
      console.error('Error fetching rides:', error);
      setRides([]);
      setPendingCount(0);
      setApprovedCount(0);
      setApprovedSum(0);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterDriver]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Calculate price based on address count and PLZ
  useEffect(() => {
    let adresaCijena = 0;
    let plzCijena = 0;
    
    const adresaNum = parseInt(brojAdresa);
    const plzNum = parseInt(plz);
    
    if (!isNaN(adresaNum) && adresaNum > 0 && stopPrices[adresaNum]) {
      adresaCijena = stopPrices[adresaNum];
    }
    if (!isNaN(plzNum) && plzPrices[plzNum]) {
      plzCijena = plzPrices[plzNum];
    }
    
    setCijena(adresaCijena + plzCijena);
  }, [brojAdresa, plz]);

  // Submit new extra ride
  const handleSubmit = async () => {
    if (!selectedDriver || !date || !tura || !plz || !brojAdresa) {
      alert('Molimo unesite sve obavezne podatke!');
      return;
    }

    console.log('🚀 Submitting extra ride:', {
      driver: selectedDriver,
      date: date,
      tura: tura,
      plz: plz,
      brojAdresa: brojAdresa,
      cijena: cijena
    });

    setSubmitting(true);
    try {
      // Calculate individual prices for storage
      const adresaNum = parseInt(brojAdresa);
      const plzNum = parseInt(plz);
      const adresaPrice = (adresaNum > 0 && stopPrices[adresaNum]) ? stopPrices[adresaNum] : 0;
      const plzPrice = plzPrices[plzNum] || 0;

      const rideData = {
        action: 'insert',
        driver: selectedDriver,
        date: date,
        tura: tura,
        plz: plz,
        broj_adresa: adresaNum,
        cijena: cijena,
        plz_price: plzPrice,
        adresa_price: adresaPrice,
        created_by: selectedDriver, // You can get this from auth context
        status: 'pending',
        created_at: new Date().toISOString()
      };

      console.log('📝 Inserting ride data:', rideData);

      const { data, error } = await supabase
        .from('extra_rides_pending')
        .insert([rideData])
        .select(); // Add select to get back the inserted data

      console.log('✅ Insert result:', { data, error });

      if (error) throw error;

      // Reset form
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTura('');
      setPlz('');
      setBrojAdresa('');
      setCijena(0);
      
      console.log('🔄 Refreshing rides list...');
      // Refresh data
      await fetchRides();
      
      alert('Ekstra vožnja je uspješno dodana!');
    } catch (error) {
      console.error('❌ Error submitting ride:', error);
      alert('Greška pri dodavanju vožnje: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '15px'
    }}>
      <CloseButton />
      
      {/* Statistika vozača card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '15px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px',
          position: 'relative'
        }}>
          <div style={{ width: '30px' }}></div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>📊</span>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '900',
                fontFamily: 'Arial, sans-serif',
                color: '#8B5CF6',
                margin: 0,
                textAlign: 'center'
              }}>
                Statistika vozača
              </h2>
            </div>
            <p style={{
              color: '#666',
              fontSize: '16px',
              margin: 0,
              fontWeight: '900',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center'
            }}>
              Brzi pregled statusa vožnji
            </p>
          </div>
          <button style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🔄
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '15px'
        }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#FFA500',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ color: 'white', fontSize: '20px' }}>⏰</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'Arial, sans-serif', color: '#333' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Na čekanju</div>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#27AE60',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ color: 'white', fontSize: '20px' }}>✓</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'Arial, sans-serif', color: '#333' }}>
              {approvedCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Odobreno</div>
          </div>
          
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#3498DB',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ color: 'white', fontSize: '20px' }}>€</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '900', fontFamily: 'Arial, sans-serif', color: '#333' }}>
              {approvedSum.toFixed(0)}
            </div>
            <div style={{ fontSize: '14px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Ukupno (€)</div>
          </div>
        </div>
      </div>

      {/* Nova ekstra vožnja card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '15px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '5px'
          }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '900',
              fontFamily: 'Arial, sans-serif',
              color: '#8B5CF6',
              margin: 0,
              textAlign: 'center'
            }}>
              Nova ekstra vožnja
            </h2>
          </div>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0,
            fontWeight: '900',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center'
          }}>
            Unesi podatke za novu vožnju
          </p>
        </div>
        
        {/* Form fields - 2x2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Datum */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span style={{ fontSize: '16px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Datum</span>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: '900',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              />
            </div>
          </div>
          
          {/* Vozač */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>👤</span>
                <span style={{ fontSize: '16px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Vozač</span>
              </div>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: '900',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              >
                <option value="">Izaberi vozača</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.ime || d.name}>
                    {d.ime || d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Tura */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🎯</span>
                <span style={{ fontSize: '16px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Tura (4 broja)</span>
              </div>
              <input
                type="text"
                placeholder="8888"
                maxLength="4"
                value={tura}
                onChange={(e) => setTura(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: '900',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              />
            </div>
          </div>
          
          {/* PLZ */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>📍</span>
                <span style={{ fontSize: '16px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>PLZ (4 broja)</span>
              </div>
              <input
                type="text"
                placeholder="9020"
                maxLength="4"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: '900',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Druga linija - Broj adresa i Cijena */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Broj adresa */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>🏠</span>
                <span style={{ fontSize: '16px', color: '#666', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>Broj adresa</span>
              </div>
              <input
                type="number"
                placeholder="120"
                value={brojAdresa}
                onChange={(e) => setBrojAdresa(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: '900',
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              />
            </div>
          </div>
          
          {/* Cijena */}
          <div>
            <div style={{
              background: '#F3F4F6',
              borderRadius: '12px',
              padding: '15px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>€</span>
                <span style={{ 
                  fontSize: '18px', 
                  color: '#333',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: '900'
                }}>
                  {cijena.toFixed(0)} €
                </span>
                <button 
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    fontSize: '14px',
                    color: '#8B5CF6',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Auto kalkulacija na osnovu PLZ-a i broja adresa"
                >
                  ℹ️
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dodaj vožnju button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '15px',
            fontSize: '18px',
            fontWeight: '900',
            fontFamily: 'Arial, sans-serif',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting ? 'Dodajem...' : 'Dodaj vožnju'}
        </button>
      </div>



      {/* Tabela card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Filtere */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          padding: '15px',
          background: '#F8F9FA',
          borderRadius: '10px',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '5px', display: 'block', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>
              🔍 Filtraj vozače
            </label>
            <select
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                background: 'white'
              }}
            >
              <option value="">Svi vozači</option>
              {drivers.map(d => (
                <option key={d.id} value={d.ime || d.name}>
                  {d.ime || d.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '5px', display: 'block', fontWeight: '900', fontFamily: 'Arial, sans-serif' }}>
              📅 Filtraj period
            </label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                background: 'white'
              }}
            />
          </div>
        </div>

        {/* Header tabele */}
        <div style={{
          background: 'linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%)',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '900'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📅</span> Datum
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>👤</span> Vozač
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>🎯</span> Tura
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>📍</span> PLZ
            </div>
          </div>
        </div>
        
        {/* Tabela sadržaj */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div>Učitavanje...</div>
          </div>
        ) : rides.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>!</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Nema vožnji za izabrani period
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {rides.map((ride, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '10px',
                  padding: '12px 15px',
                  marginBottom: '8px',
                  background: ride.status === 'pending' ? '#FFF3CD' : '#D4EDDA',
                  borderRadius: '8px',
                  border: `1px solid ${ride.status === 'pending' ? '#FFC107' : '#27AE60'}`,
                  fontSize: '16px',
                  fontWeight: '700'
                }}
              >
                <div style={{ fontWeight: '900' }}>
                  {format(new Date(ride.date), 'dd.MM.yyyy')}
                </div>
                <div>{ride.driver}</div>
                <div>{ride.tura}</div>
                <div>{ride.plz}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
