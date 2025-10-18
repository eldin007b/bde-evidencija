import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import MapCardModern from '../components/shared/MapCardModern';
import MapView from '../components/shared/MapView';

const NavigacijaScreen = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const footerRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState('night');
  
  // State za address selection kao na HomeScreen
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState({ 
    address: '', 
    city: '', 
    lat: null, 
    lon: null 
  });

  // Fiksna NIGHT tema
  const themes = {
    night: { background: 'from-slate-900 via-blue-900 to-indigo-900', accent: 'from-blue-400 to-purple-400' }
  };

  useEffect(() => {
    setCurrentTheme('night');
  }, []);

  const isNightTheme = currentTheme === 'night';
  const isMobile = (typeof window !== 'undefined') ? window.innerWidth < 768 : false;

  // Osiguraj da Leaflet preračuna veličinu nakon mount-a
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
        console.log('🗺️ Invalidating map size...');
        mapRef.current.invalidateSize();
      }
    };

    // Pozovi samo jednom nakon mount-a
    const timeout = setTimeout(handleResize, 500);
    
    // Dodaj listener za resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Prazna dependency lista da se pokrene samo jednom

  // Geolocation kao na HomeScreen
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (error) => console.warn('Geolocation error:', error)
      );
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themes[currentTheme].background} transition-all duration-1000`}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
          className={`absolute top-20 left-10 w-96 h-96 bg-gradient-to-r ${themes[currentTheme].accent} rounded-full mix-blend-multiply filter blur-3xl opacity-20`} 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: [90, 0, 90] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
          className={`absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r ${themes[currentTheme].accent} rounded-full mix-blend-multiply filter blur-3xl opacity-20`} 
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => navigate(-1)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                isNightTheme 
                  ? 'bg-gray-800/90 border-gray-700 text-gray-100 hover:bg-gray-700/90' 
                  : 'bg-white/90 border-gray-200 text-gray-700 hover:bg-white/95'
              } shadow-lg hover:shadow-xl`}
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${themes[currentTheme].accent} shadow-lg`}>
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isNightTheme ? 'text-white' : 'text-gray-900'}`}>
                  Navigacija
                </h1>
                <p className={`text-sm ${isNightTheme ? 'text-gray-400' : 'text-gray-600'}`}>
                  Mapa dostave - Austrija
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`relative z-10 ${isMobile ? 'h-screen' : 'px-2 md:px-6 pb-2 md:pb-6'}`}
      >
        <div className={`${isMobile ? 'h-full' : `rounded-lg md:rounded-2xl backdrop-blur-sm border overflow-hidden shadow-2xl h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] ${
          isNightTheme 
            ? 'bg-gray-800/90 border-gray-700' 
            : 'bg-white/90 border-gray-200'
        }`}`}>
          <MapCardModern 
            title="Navigacija - Mapa dostave"
            mapRef={mapRef} 
            footerRef={footerRef}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
            address={selectedAddress?.address || ''}
            city={selectedAddress?.city || ''}
            selectedMarker={selectedAddress}
            headerHeight={isMobile ? 120 : 160}
            sidebarLayout={!isMobile}
            hideSearchAndInfo={isMobile}
            onNavigate={(addressOrObj) => {
              // Funkcionalnost navigacije kao na HomeScreen
              if (addressOrObj && typeof addressOrObj === 'object' && typeof addressOrObj.lat === 'number' && typeof addressOrObj.lon === 'number') {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${addressOrObj.lat},${addressOrObj.lon}`)}&travelmode=driving`, '_blank');
                return;
              }
              if (addressOrObj) {
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrObj)}`, '_blank');
              }
            }}
            onSearchSelect={(addressData) => {
              console.log('🎯 Address selected:', addressData);
              setSelectedAddress(addressData);
            }}
            onLocateMe={setUserLocation}
          >
            <MapView
              onAddressSelect={(addressData) => {
                console.log('🗺️ MapView address select:', addressData);
                setSelectedAddress(addressData);
              }}
              mapRef={mapRef}
              selectedMarker={selectedAddress}
              userLocation={userLocation}
              routeInfo={null}
            />
          </MapCardModern>
        </div>
      </motion.div>

      {/* Mobile Back Button - floating na vrhu levo samo za mobilnu verziju */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => navigate(-1)}
          className="fixed top-4 left-4 z-50 p-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </motion.button>
      )}
    </div>
  );
};

export default NavigacijaScreen;
