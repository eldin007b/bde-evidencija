import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Ova komponenta forsira Leaflet da izračuna veličinu mape kad se parent promijeni
const ForceMapResize = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
};

export default ForceMapResize;
