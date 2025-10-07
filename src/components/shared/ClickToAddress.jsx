import { useMapEvents, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';

const NominatimURL = 'https://nominatim.openstreetmap.org/reverse?format=json&accept-language=de&addressdetails=1';

const ClickToAddress = () => {
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState('');

  useMapEvents({
    click: async (e) => {
      setMarker(e.latlng);
      setAddress('Učitavanje adrese...');
      try {
        const url = `${NominatimURL}&lat=${e.latlng.lat}&lon=${e.latlng.lng}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress('Adresa nije pronađena');
        }
      } catch {
        setAddress('Greška pri dohvaćanju adrese');
      }
    }
  });


// Archived ClickToAddress - replaced with stub to keep imports safe
export default null;
