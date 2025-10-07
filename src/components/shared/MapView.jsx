import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet';
import ForceMapResize from './ForceMapResize';
import ClickToVORAddress from './ClickToVORAddress';
import L from 'leaflet';
import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './MapView.module.css'; // CSS modul za MapView
import useDebounce from '../../hooks/useDebounce';
import LoadingSpinner from '../common/LoadingSpinner';

// ... ostatak importova ...

function PopupContentSearch({ address, lat, lon, onClose }) {
  let line1 = address;
  let line2 = '';
  if (address && address.includes(',')) {
    const parts = address.split(',');
    line1 = parts[0].trim();
    line2 = parts.slice(1).join(',').trim();
  }

  const navUrl = lat && lon
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    : '#';

  return (
    <div className={styles.popupContent}>
      <button
        onClick={onClose}
        className={styles.popupCloseBtn}
        aria-label="Zatvori popup"
        title="Zatvori"
      >
        ×
      </button>
      <div className={styles.popupAddress}>
        {line1}
        {line2 && <><br />{line2}</>}
      </div>
      <button
        onClick={() => window.open(navUrl, '_blank')}
        className={styles.popupNavBtn}
      >
        Navigiraj ovdje
      </button>
    </div>
  );
}

// Small helper: shows the user's current location as a CircleMarker
function UserLocationMarker({ position }) {
  if (!position || !Array.isArray(position)) return null;
  return (
    <CircleMarker
      center={position}
      radius={9}
      pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.95, weight: 3 }}
    />
  );
}

// Shows a selected/search location. Includes a popup that can call onAddressSelect when closed.
function SelectedLocationMarker({ marker, onAddressSelect }) {
  if (!marker || !marker.lat || !marker.lon) return null;
  const center = [marker.lat, marker.lon];
  return (
    <Marker position={center}>
      <Popup
        autoPan={true}
        autoClose={false}
        closeOnClick={false}
      >
        <PopupContentSearch
          address={marker.data?.nameFormatted?.text || marker.data?.name || marker.label || ''}
          lat={marker.lat}
          lon={marker.lon}
          onClose={() => { if (onAddressSelect) onAddressSelect(null); }}
        />
      </Popup>
    </Marker>
  );
}

export default function MapView({
  onAddressSelect,
  mapRef,
  selectedMarker,
  userLocation
}) {
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 350);
  const localMapRef = useRef();
  const inputRef = useRef();
  const abortRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const effectiveMapRef = mapRef || localMapRef;

  // suggestionProvider: optional prop to provide fetching function (keeps backwards compatibility)
  // default implementation uses Nominatim (demo). If your app already has a provider, pass it in props.
  const suggestionProvider = useRef(null);

  useEffect(() => {
    let mounted = true;
    // cancel previous request if any
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch (e) { /* noop */ }
      abortRef.current = null;
    }

    if (!debouncedSearch || debouncedSearch.trim() === '') {
      setSuggestions([]);
      setLoadingSuggest(false);
      setActiveIdx(-1);
      return () => { mounted = false; };
    }

    setLoadingSuggest(true);
    setActiveIdx(-1);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const q = debouncedSearch.trim();
        // If an external provider is supplied via ref, call it; else fallback to demo Nominatim
        if (suggestionProvider.current && typeof suggestionProvider.current === 'function') {
          const items = await suggestionProvider.current(q, { signal: controller.signal });
          if (!mounted) return;
          setSuggestions(items || []);
        } else {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6`;
          const res = await fetch(url, { signal: controller.signal });
          const data = await res.json();
          if (!mounted) return;
          const mapped = data.map(d => ({
            name: d.display_name,
            lat: parseFloat(d.lat),
            lon: parseFloat(d.lon),
            nameFormatted: { text: d.display_name }
          }));
          setSuggestions(mapped);
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          // aborted, ignore
        } else {
          // generic failure -> clear suggestions
          if (mounted) setSuggestions([]);
        }
      } finally {
        if (mounted) setLoadingSuggest(false);
      }
    })();

    return () => {
      mounted = false;
      try { controller.abort(); } catch (e) {}
      abortRef.current = null;
    };
  }, [debouncedSearch]);

  // Keyboard navigation for suggestions
  const moveActive = useCallback((delta) => {
    setActiveIdx(prev => {
      const len = suggestions.length;
      if (len === 0) return -1;
      let next = prev + delta;
      if (next < 0) next = len - 1;
      if (next >= len) next = 0;
      return next;
    });
  }, [suggestions.length]);

  const onInputKeyDown = (e) => {
    if (!showSearch) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'Escape') { setShowSearch(false); }
    else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeIdx]);
      }
    }
  };

  return (
    <div className={styles.mapContainer}>
      {/* SEARCH OVERLAY */}
      {showSearch && (
        <div className={styles.searchOverlay}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <input
              ref={inputRef}
              type="text"
              maxLength={20}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
                onKeyDown={onInputKeyDown}
              placeholder="Unesi adresu..."
              className={styles.searchInput}
              autoComplete="off"
            />
          </form>
          <div className={styles.suggestionsBox} role="list" aria-label="Rezultati pretrage">
            {loadingSuggest ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
                <LoadingSpinner />
              </div>
            ) : suggestions.length === 0 ? (
              <div className={styles.noResults}>
                Nema rezultata
              </div>
            ) : (
              suggestions.map((loc, idx) => {
                // compute distKm if userLocation exists
                let distKm = null;
                try {
                  if (userLocation && loc.lat && loc.lon) {
                    const toRad = v => (v * Math.PI) / 180;
                    const R = 6371; // km
                    const dLat = toRad(loc.lat - userLocation[0]);
                    const dLon = toRad(loc.lon - userLocation[1]);
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(userLocation[0])) * Math.cos(toRad(loc.lat)) * Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    distKm = R * c;
                  }
                } catch (e) { distKm = null; }

                return (
                  <div
                    key={idx}
                    role="listitem"
                    onClick={() => handleSuggestionClick(loc)}
                    className={`${styles.suggestionItem} ${idx === activeIdx ? styles.suggestionActive : ''}`}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') handleSuggestionClick(loc); }}
                  >
                    <span className={styles.suggestionMain}>
                      {loc.nameFormatted?.text || loc.name || 'Adresa'}
                    </span>
                    <div className={styles.suggestionMeta}>
                      {loc.nameFormatted?.text && loc.nameFormatted?.text !== loc.name && (
                        <span className={styles.suggestionType}>
                          {loc.name}
                        </span>
                      )}
                      {distKm !== null && (
                        <span className={styles.suggestionDistance}>
                          {distKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* MAP CONTAINER */}
      <MapContainer
        ref={effectiveMapRef}
        whenCreated={(map) => {
          // Ensure the parent-provided mapRef receives the Leaflet map instance
          try {
            if (mapRef && mapRef.current !== map) mapRef.current = map;
            // Also keep local ref in sync for internal fallback
            if (localMapRef && localMapRef.current !== map) localMapRef.current = map;
          } catch (e) {
            // Defensive: ignore in environments where refs are read-only
          }
        }}
        center={userLocation && Array.isArray(userLocation) ? userLocation : [48.2082, 16.3738]}
        zoom={userLocation ? 17 : 13}
        className={styles.leafletContainer}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://mapsneu.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png"
          attribution='&copy; <a href="https://basemap.at">basemap.at</a>'
        />

        <UserLocationMarker position={userLocation} />
        {selectedMarker && selectedMarker.lat && selectedMarker.lon && (
          <SelectedLocationMarker
            marker={selectedMarker}
            onAddressSelect={onAddressSelect}
          />
        )}
        <ClickToVORAddress onAddressSelect={onAddressSelect} />
        <ForceMapResize />
      </MapContainer>
    </div>
  );
}