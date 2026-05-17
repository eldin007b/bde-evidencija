
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import ForceMapResize from './ForceMapResize';
import ClickToVORAddress from './ClickToVORAddress';
import React, { useCallback, useRef, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatDistance, formatDuration } from '../../utils/googleMaps';

// Fix za Leaflet ikone
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
    <circle cx="12" cy="10" r="3" fill="white"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

L.Marker.prototype.options.icon = DefaultIcon;

function PopupContentSearch({ address, lat, lon, onClose, routeInfo, userLocation }) {
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

  // Calculate estimated time and distance using the same logic and formatting as info bar
  let timeDistance = null;
  
  if (routeInfo && routeInfo.distanceMeters && routeInfo.durationSeconds) {
    // Use route info if available (MapQuest data)
    const durationText = routeInfo.durationText || formatDuration(routeInfo.durationSeconds) || '--';
    const distanceText = routeInfo.distanceText || formatDistance(routeInfo.distanceMeters) || '--';
    timeDistance = `${durationText} • ${distanceText}`;
  } else if (routeInfo && routeInfo.distance && routeInfo.duration) {
    // Legacy format support
    const durationText = formatDuration(routeInfo.duration) || '--';
    const distanceText = formatDistance(routeInfo.distance) || '--';
    timeDistance = `${durationText} • ${distanceText}`;
  } else if (userLocation && lat && lon) {
    // Haversine distance calculation as fallback (same as info bar)
    const R = 6371; // Earth's radius in km
    const dLat = (lat - userLocation[0]) * Math.PI / 180;
    const dLon = (lon - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const aerialKm = R * c;
    const aerialMeters = Math.round(aerialKm * 1000);
    
    // Estimate duration using average speed (same as info bar logic)
    const avgSpeedKmh = 40; // Average speed for estimation
    const estSeconds = aerialMeters > 0 ? Math.round((aerialKm / avgSpeedKmh) * 3600) : null;
    
    const durationText = estSeconds ? formatDuration(estSeconds) : '--';
    const distanceText = formatDistance(aerialMeters);
    timeDistance = `${durationText} • ${distanceText}`;
  }

  return (
    <div 
      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 min-w-[240px] max-w-[320px] border border-gray-100 relative z-50"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute -top-2 -right-2 w-8 h-8 flex items-center justify-center bg-gray-800 text-white hover:bg-gray-900 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-50"
        aria-label="Zatvori popup"
        title="Zatvori"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <div className="space-y-4">
        {/* Location Info */}
        <div className="flex items-start gap-3">
          {/* Uklonjen crveni SVG marker iz popupa */}
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 leading-tight">
              {line1}
            </div>
            {line2 && (
              <div className="text-sm text-gray-600 mt-1">
                {line2}
              </div>
            )}
          </div>
        </div>
        
        {/* Distance & Time */}
        {timeDistance && (
          <div className="flex items-center justify-center py-2 px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {timeDistance}
            </div>
          </div>
        )}
        
        {/* Navigation Button */}
        <button
          onClick={() => window.open(navUrl, '_blank')}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Pokreni navigaciju
        </button>
      </div>
    </div>
  );
}

// Small helper: shows the user's current location with dynamic marker based on movement
function UserLocationMarker({ position, address, speed = 0, heading = 0, isFullscreen = false }) {
  if (!position) {
    return null;
  }
  
  // Prikazuj marker uvijek kada imate poziciju
  // const shouldShow = isFullscreen || speed > 0;
  // if (!shouldShow) return null;
  // Marker se sada prikazuje uvijek

  // Custom HTML marker based on speed
  const createCustomIcon = () => {
    const isMoving = speed > 1; // više od 1 m/s (3.6 km/h)
    
    if (isMoving) {
      // Moving - strelica koja pokazuje smjer
      return L.divIcon({
        html: `
          <div style="transform: rotate(${heading}deg); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; background: #3b82f6; border: 4px solid white; border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l8 20-8-6-8 6 8-20z"/>
              </svg>
            </div>
          </div>
        `,
        className: 'custom-location-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    } else {
      // Stationary - jednostavna plava tačka
      return L.divIcon({
        html: `
          <div style="width: 16px; height: 16px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); animation: pulse 2s infinite;">
          </div>
          <style>
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          </style>
        `,
        className: 'custom-location-marker-static',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
    }
  };

  return (
    <Marker position={position} icon={createCustomIcon()}>
      <Popup>{typeof address !== 'undefined' && address ? String(address) : 'Moja lokacija'}</Popup>
    </Marker>
  );
}

// Shows a selected/search location. Includes a popup that can call onAddressSelect when closed.
function SelectedLocationMarker({ marker, onAddressSelect, routeInfo, userLocation }) {
  const markerRef = useRef();
  
  // Automatski otvori popup kada se marker kreira
  useEffect(() => {
    if (markerRef.current && marker && marker.lat && marker.lon) {
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 100);
    }
  }, [marker?.lat, marker?.lon]);
  
  if (!marker || !marker.lat || !marker.lon) return null;
  const center = [marker.lat, marker.lon];
  
  return (
    <Marker position={center} ref={markerRef}>
      <Popup
        autoPan={true}
        autoClose={false}
        closeOnClick={false}
      >
        <PopupContentSearch
          address={
            marker.data?.nameFormatted?.text ||
            marker.data?.name ||
            marker.label ||
            `${String(marker.address || '')}${marker.city ? `, ${String(marker.city)}` : ''}`
          }
          lat={marker.lat}
          lon={marker.lon}
          routeInfo={routeInfo}
          userLocation={userLocation}
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
  userLocation,
  routeInfo,
  currentAddress,
  speed,
  heading,
  isFullscreen
}) {
  const localMapRef = useRef();
  const effectiveMapRef = mapRef || localMapRef;

  const handleMapCreated = useCallback((mapInstance) => {
    if (effectiveMapRef) {
      effectiveMapRef.current = mapInstance;
    }
  }, [effectiveMapRef]);

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div className="w-full h-full">
        <MapContainer
          center={[47.0707, 15.4395]}
          zoom={8}
          className="w-full h-full z-0"
          ref={handleMapCreated}
          maxZoom={18}
          minZoom={6}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://maps.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png"
            attribution='Datenquelle: <a href="https://www.basemap.at">basemap.at</a>'
            maxZoom={19}
          />
          <ForceMapResize />
          {userLocation && (
            <UserLocationMarker 
              position={userLocation} 
              address={currentAddress} 
              speed={speed}
              heading={heading}
              isFullscreen={isFullscreen}
            />
          )}
          {selectedMarker && (
            <SelectedLocationMarker
              marker={selectedMarker}
              onAddressSelect={onAddressSelect}
              routeInfo={routeInfo}
              userLocation={userLocation}
            />
          )}
          {/* Marker na centru ekrana uklonjen */}
          <ClickToVORAddress onAddressSelect={onAddressSelect} />
        </MapContainer>
        {/* Prikaz brzine u fullscreen modu */}
        {typeof speed !== 'undefined' && isFullscreen && (
          <div className="absolute right-6 bottom-6 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-2xl px-4 py-3 shadow-xl z-1000">
            <div className="flex items-center gap-2">
              {/* Uklonjena tačka */}
              <span className="font-bold text-lg text-slate-800">{speed ? (speed * 3.6).toFixed(1) : '0'}</span>
              <span className="text-sm text-slate-700 font-medium">km/h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}