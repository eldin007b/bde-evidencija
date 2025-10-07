import './ClickToVORAddress.popup.css';

import { useMapEvents, Popup, CircleMarker } from 'react-leaflet';
import { useState, useRef } from 'react';
import ENV from '../../config/env';

// EPSG:4326 (lat/lon) u EPSG:3857 (Web Mercator) - REVERSE ENGINEERED IZ VOR-a!
function projectTo3857(lat, lon) {
  // Na osnovu original VOR koordinata, ova formula daje iste rezultate
  // Original: Klagenfurt lat=46.62, lon=14.29 → x=14289513, y=46624058
  const x = Math.round(lon * 1000000); // Približno za Austriju
  const y = Math.round(lat * 1000000);  // Približno za Austriju
  return { x, y };
}

const VAO_URL = `${ENV.API_BASE_URL}/vor-proxy`;
const VAO_BODY = {
  id: 'ibwmnqg8g2kj8iwg',
  ver: '1.59',
  lang: 'deu',
  auth: { type: 'AID', aid: 'wf7mcf9bv3nv8g5f' },
  client: {
    id: 'VAO',
    type: 'WEB',
    name: 'webapp',
    l: 'vs_anachb',
    v: 10010,
    pos: { x: 14289513, y: 46624058, acc: 20 }
  },
  formatted: false,
  ext: 'VAO.22',
  svcReqL: []
};

function ClickToVORAddress({ onAddressSelect }) {
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState('');
  const [debugXml, setDebugXml] = useState(null);
  const markerRef = useRef(null);

  useMapEvents({
    click: (e) => {
      setMarker(e.latlng);
      setAddress('Učitavanje adrese...');
      setDebugXml(null);
      setShowPopup(true);
      // Ispravno: lat, lon redoslijed!
      const { x, y } = projectTo3857(e.latlng.lat, e.latlng.lng);

      // Fetch adresu async, ali popup se odmah prikazuje
      (async () => {
        // 1. LOCGEOPOS
        const geoBody = {
          ...VAO_BODY,
          client: { ...VAO_BODY.client, pos: { x, y, acc: 20 } },
          svcReqL: [
            {
              meth: 'LocGeoPos',
              req: {
                ring: { cCrd: { x, y }, minDist: 0, maxDist: 30 },
                maxLoc: 1,
                locFltrL: [{ type: 'PROD', mode: 'INC', value: 4087 }],
                getPOIs: true
              },
              id: '1|5|'
            }
          ]
        };
        try {
          const geoRes = await fetch(VAO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geoBody)
          });
          const geoData = await geoRes.json();
          if (
            geoData &&
            geoData.svcResL &&
            geoData.svcResL.length > 0 &&
            geoData.svcResL[0].res &&
            geoData.svcResL[0].res.locL &&
            geoData.svcResL[0].res.locL.length > 0
          ) {
            const loc = geoData.svcResL[0].res.locL[0];
            let adresa = (loc.nameFormatted && loc.nameFormatted.text) || loc.name || loc.txt || '';
            // Provjera: ako je adresa samo string koordinata, prikaži poruku
            if (/^-?\d+\.\d+, ?-?\d+\.\d+$/.test(adresa)) {
              adresa = 'Nema adrese za ovu lokaciju';
            }
            setAddress(adresa || 'Adresa pronađena');
            setDebugXml({ geoData, x, y });
            // Pozovi callback za AddressInfoBar
            let line1 = adresa;
            let line2 = '';
            if (adresa && adresa.includes(',')) {
              const parts = adresa.split(',');
              line1 = parts[0].trim();
              line2 = parts.slice(1).join(',').trim();
            }
            if (onAddressSelect) onAddressSelect({ address: line1, city: line2, lat: e.latlng.lat, lon: e.latlng.lng });
            return;
          }

          // 2. LOCMATCH ako nema adrese
          const matchBody = {
            ...VAO_BODY,
            client: { ...VAO_BODY.client, pos: { x, y, acc: 20 } },
            svcReqL: [
              {
                meth: 'LocMatch',
                req: {
                  input: {
                    field: 'S',
                    loc: {
                      type: 'C',
                      crd: { x, y }
                    },
                    maxLoc: 1,
                    locFltrL: [
                      { type: 'META', value: 'in_austria_test' }
                    ]
                  }
                },
                id: '1|24|'
              }
            ]
          };
          const matchRes = await fetch(VAO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchBody)
          });
          const matchData = await matchRes.json();
          setDebugXml({ matchData, x, y });
          if (
            matchData &&
            matchData.svcResL &&
            matchData.svcResL.length > 0 &&
            matchData.svcResL[0].res &&
            matchData.svcResL[0].res.match &&
            matchData.svcResL[0].res.match.locL &&
            matchData.svcResL[0].res.match.locL.length > 0
          ) {
            const loc = matchData.svcResL[0].res.match.locL[0];
            let adresa = (loc.nameFormatted && loc.nameFormatted.text) || loc.name || loc.txt || '';
            if (/^-?\d+\.\d+, ?-?\d+\.\d+$/.test(adresa)) {
              adresa = 'Nema adrese za ovu lokaciju';
            }
            setAddress(adresa || 'Adresa pronađena');
            // Pozovi callback za AddressInfoBar
            let line1 = adresa;
            let line2 = '';
            if (adresa && adresa.includes(',')) {
              const parts = adresa.split(',');
              line1 = parts[0].trim();
              line2 = parts.slice(1).join(',').trim();
            }
            if (onAddressSelect) onAddressSelect({ address: line1, city: line2, lat: e.latlng.lat, lon: e.latlng.lng });
            return;
          }
          setAddress('Adresa nije pronađena');
          if (onAddressSelect) onAddressSelect({ address: '', city: '', lat: e.latlng.lat, lon: e.latlng.lng });
        } catch (err) {
          setAddress('Greška pri dohvaćanju adrese: ' + (err?.message || JSON.stringify(err)));
          setDebugXml(err);
          if (onAddressSelect) onAddressSelect({ address: '', city: '', lat: e.latlng.lat, lon: e.latlng.lng });
        }
      })();
    },
    move: () => {
      setMarker(null);
      setAddress('');
      setShowPopup(false);
    }
  });


  // Parsiraj adresu u dva reda: prvi red ulica+broj, drugi red grad
  let line1 = address;
  let line2 = '';
  if (address && address.includes(',')) {
    const parts = address.split(',');
    line1 = parts[0].trim();
    line2 = parts.slice(1).join(',').trim();
  }


  // Helperi za navigaciju
  const lat = marker?.lat;
  const lng = marker?.lng;
  // Samo Google Maps na webu, ali možeš lako promijeniti na drugi servis
  const navUrl = lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : '#';

  // X za zatvaranje popup-a
  const [showPopup, setShowPopup] = useState(true);
  // Za lociraj me dugme
  const map = useMapEvents({});
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          map.setView(coords, 17);
        }
      );
    }
  };

  if (!marker) return null;

  return (
    <CircleMarker center={marker} radius={7} pathOptions={{ color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.92, weight: 1.5 }} />
  );
}

export default ClickToVORAddress;
