
import React, { useState, useEffect, useRef } from 'react';
import styles from './AddressInfoBar.module.css';
import { searchAddresses } from './AddressSearchService';

// Props: { address, city, onNavigate, onSearchSelect, mapRef }
export default function AddressInfoBar({ address, city, onNavigate, onSearchSelect, mapRef, onLocateMe, compact = false }) {
  // Zoom kontrole
  const handleZoomIn = () => {
    if (mapRef && mapRef.current && mapRef.current.zoomIn) mapRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapRef && mapRef.current && mapRef.current.zoomOut) mapRef.current.zoomOut();
  };
  // Lociraj me
  const handleLocateMe = () => {
    if (navigator.geolocation && mapRef && mapRef.current && mapRef.current.setView) {
      console.log('[AddressInfoBar] Klik na LOCIRAJ ME');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          console.log('[AddressInfoBar] Koordinate:', coords);
          mapRef.current.setView(coords, 17);
          if (onLocateMe) {
            onLocateMe(coords);
          }
        }
      );
    }
  };
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef();

  // Kad korisnik piše, fetchaj prijedloge
  useEffect(() => {
    let ignore = false;
    if (!inputValue) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    searchAddresses(inputValue).then(results => {
      if (!ignore) {
        setSuggestions(results);
        setLoading(false);
      }
    }).catch(() => {
      if (!ignore) {
        setSuggestions([]);
        setLoading(false);
      }
    });
    return () => { ignore = true; };
  }, [inputValue]);

  // Kad klikneš na mapu i dođe nova adresa, upiši je u input
  useEffect(() => {
    // Resetuj suggestions i inputValue na svaku promjenu adrese iz mape
    setSuggestions([]);
    setIsInputFocused(false);
    if (inputRef.current) inputRef.current.blur();
    setInputValue(address ? (city ? address + ', ' + city : address) : '');
  }, [address, city]);

  // Klik na prijedlog: centriraj mapu i ažuriraj bar
  const handleSuggestionClick = (loc) => {
    const x = loc.crd?.x;
    const y = loc.crd?.y;
    if (typeof x === 'number' && typeof y === 'number' && mapRef && mapRef.current && mapRef.current.setView) {
      const lat = y / 1e6;
      const lon = x / 1e6;
      mapRef.current.setView([lat, lon], 17);
      let full = loc.nameFormatted?.text || loc.name || '';
      let addr = full;
      let grad = '';
      const brRegex = /<br\s*\/?.*?>/i;
      if (brRegex.test(full)) {
        const parts = full.split(brRegex);
        addr = parts[0].trim();
        grad = parts.slice(1).join(' ').trim();
      } else if (full.includes(',')) {
        const parts = full.split(',');
        addr = parts[0].trim();
        grad = parts.slice(1).join(',').trim();
      }
      setInputValue(addr + (grad ? ', ' + grad : ''));
      if (onSearchSelect) onSearchSelect({ address: addr, city: grad, lat, lon });
      setSuggestions([]);
    }
  };

  // Navigacija koristi vrijednost iz inputa
  const handleNavigate = () => {
    if (onNavigate && inputValue) {
      onNavigate(inputValue);
    }
  };

  const outerStyle = compact
    ? { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }
    : { flexDirection: 'column', alignItems: 'stretch', gap: 6 };

  const inputWrapStyle = compact ? { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, flex: 1 } : {};

  return (
    <div className={styles.infoBar} style={outerStyle}>
      <div className={styles.inputWrap} style={inputWrapStyle}>
        <div className={styles.zoomGroup}>
          <button className={styles.barBtn} style={{width: 38, height: 38}} onClick={handleZoomIn} title="Povećaj zoom">+</button>
          <button className={styles.barBtn} style={{width: 38, height: 38}} onClick={handleZoomOut} title="Smanji zoom">-</button>
          <button className={styles.barBtn} style={{width: 38, height: 38, padding: 0}} onClick={handleLocateMe} title="Lociraj me">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2.5"/>
              <line x1="12" y1="2" x2="12" y2="6" stroke="#fff" strokeWidth="2.5"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2.5"/>
              <line x1="2" y1="12" x2="6" y2="12" stroke="#fff" strokeWidth="2.5"/>
              <line x1="18" y1="12" x2="22" y2="12" stroke="#fff" strokeWidth="2.5"/>
              <circle cx="12" cy="12" r="4" fill="#1e90ff" stroke="#fff" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
        <input
          ref={inputRef}
          type="text"
          className={styles.addressInput}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          style={compact ? { flex: 1, minWidth: 120 } : undefined}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setTimeout(() => setIsInputFocused(false), 120)}
          placeholder="Pretraži adresu ili klikni na mapi…"
          autoComplete="off"
        />
        <button className={styles.navigateBtn} onClick={handleNavigate} disabled={!inputValue}>
          Navigacija
        </button>
        {isInputFocused && inputValue && suggestions.length > 0 && (
          <div className={styles.suggestionsBox}>
            {loading ? (
              <div style={{ padding: 14, color: '#b0b8c9', fontSize: 16, textAlign: 'center' }}>Učitavanje…</div>
            ) : suggestions.length === 0 ? (
              <div style={{ padding: 14, color: '#b0b8c9', fontSize: 16, textAlign: 'center' }}>Nema rezultata</div>
            ) : (
              suggestions.map((loc, idx) => {
                let full = loc.nameFormatted?.text || loc.name || '';
                let addr = full;
                let grad = '';
                const brRegex = /<br\s*\/?.*?>/i;
                if (brRegex.test(full)) {
                  const parts = full.split(brRegex);
                  addr = parts[0].trim();
                  grad = parts.slice(1).join(' ').trim();
                } else if (full.includes(',')) {
                  const parts = full.split(',');
                  addr = parts[0].trim();
                  grad = parts.slice(1).join(',').trim();
                }
                return (
                  <div
                    key={idx}
                    className={styles.suggestionItem}
                    onClick={() => handleSuggestionClick(loc)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') handleSuggestionClick(loc); }}
                  >
                    <span style={{ fontWeight: 600, color: '#1e90ff', fontSize: 17 }}>{addr}</span>
                    {grad && <span style={{ marginLeft: 10, color: '#b0b8c9', fontSize: 15 }}>{grad}</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
