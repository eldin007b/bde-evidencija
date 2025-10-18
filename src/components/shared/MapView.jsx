
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from 'react-leaflet';
import ForceMapResize from './ForceMapResize';
import ClickToVORAddress from './ClickToVORAddress';
import L from 'leaflet';
import React, { useCallback, useRef, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';

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

  // Calculate estimated time and distance if we have route info or user location
  let timeDistance = null;
  if (routeInfo && routeInfo.distance && routeInfo.duration) {
    const distanceKm = (routeInfo.distance / 1000).toFixed(1);
    const timeMin = Math.round(routeInfo.duration / 60);
    timeDistance = `${timeMin} min • ${distanceKm} km`;
  } else if (userLocation && lat && lon) {
    // Simple haversine distance calculation as fallback
    const R = 6371; // Earth's radius in km
    const dLat = (lat - userLocation[0]) * Math.PI / 180;
    const dLon = (lon - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    const estimatedTime = Math.round((distance / 50) * 60); // Assume 50 km/h average speed
    timeDistance = `${estimatedTime} min • ${distance.toFixed(1)} km`;
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
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
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
          <div className="flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
            Pokreni navigaciju
          </div>
        </button>
      </div>
    </div>
  );
}

// Small helper: shows the user's current location as a CircleMarker
function UserLocationMarker({ position }) {
  // Uklonjen prikaz plavog kruga - marker se prikazuje u MapCardModern
  return null;
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
          address={marker.data?.nameFormatted?.text || marker.data?.name || marker.label || `${marker.address || ''}${marker.city ? `, ${marker.city}` : ''}`}
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
  routeInfo
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
          center={[47.0707, 15.4395]} // Default center (Austria)
          zoom={8}
          className="w-full h-full z-0"
          ref={handleMapCreated}
          maxZoom={18}
          minZoom={6}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Austrian basemap - working version */}
          <TileLayer
            url="https://maps.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png"
            attribution='Datenquelle: <a href="https://www.basemap.at">basemap.at</a>'
            maxZoom={19}
          />
          
          {/* VOR proxy tile layer - temporarily disabled due to API issues */}
          {/* <TileLayer
            url="https://dsltpiupbfopyvuiqffg.supabase.co/functions/v1/vor-proxy?z={z}&x={x}&y={y}"
            attribution='Datenquelle: VOR Austria via Supabase'
            maxZoom={19}
            eventHandlers={{
              loading: () => console.log('🗺️ VOR tiles loading...'),
              load: () => console.log('✅ VOR tiles loaded successfully'),
              tileerror: (e) => {
                console.error('❌ VOR tile error:', e);
                console.error('Failed URL:', e.tile?.src || 'unknown');
                console.log('💡 Falling back to OpenStreetMap...');
              },
              tileloadstart: (e) => {
                console.log('🔄 Loading tile:', e.url);
              }
            }}
          /> */}
          
          <ForceMapResize />
          
          {userLocation && (
            <UserLocationMarker position={userLocation} />
          )}
          
          {selectedMarker && (
            <SelectedLocationMarker
              marker={selectedMarker}
              onAddressSelect={onAddressSelect}
              routeInfo={routeInfo}
              userLocation={userLocation}
            />
          )}
          
          <ClickToVORAddress onAddressSelect={onAddressSelect} />
        </MapContainer>
      </div>
    </div>
  );
}