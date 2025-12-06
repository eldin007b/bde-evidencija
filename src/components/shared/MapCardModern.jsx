// MapCardModern.jsx - Fixed version with proper desktop split-screen layout
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { searchAddresses } from './AddressSearchService';
import { getDrivingRouteInfo, formatDistance as gmFormatDistance, formatDuration as gmFormatDuration } from '../../utils/googleMaps';
import { getRouteFromMapQuest } from '../../utils/mapQuest';
import { fetchVoranachbRoute } from '../../utils/voranachb';
import ENV from '../../config/env';
import { analyzePolyline } from '../../utils/polylineUtils';
import { useBatteryOptimization } from '../../services/BatteryOptimizationService';
import { useDeboncedReverseGeocoding } from '../../services/DebouncedReverseGeocodingService';

const MapCardModern = ({ 
  children, 
  className = '', 
  style, 
  title = 'Mapa dostave - Austrija',
  loading = false,
  address = '',
  city = '',
  onNavigate,
  onSearchSelect,
  mapRef,
  onLocateMe,
  autoLocate = true,
  selectedMarker = null,
  footerRef,
  isMobile = (typeof window !== 'undefined') ? window.innerWidth < 768 : false,
  sidebarLayout = false,
  headerHeight = 80,
  onMapClickCloseSidebar,
  alwaysShowSearchInterface = false,
  hideSearchAndInfo = false
}) => {
  // States
  const [currentCoords, setCurrentCoords] = useState(null);
  const [currentAddress, setCurrentAddress] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [polylineAnalysis, setPolylineAnalysis] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);
  
  const [justSelectedSuggestion, setJustSelectedSuggestion] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Battery optimization hook
  const { config: gpsConfig, mode: batteryMode, getAdaptiveConfig } = useBatteryOptimization();
  
  // Debounced reverse geocoding hook
  const { 
    reverseGeocode: debouncedReverseGeocode, 
    isLoading: debouncedGeocodingLoading,
    lastResult: lastGeocodingResult,
    service: geoService
  } = useDeboncedReverseGeocoding();

  // Debug log initial props (removed for production)

  // Refs
  const inputRef = useRef(null);
  const mapContentRef = useRef(null);
  const watchIdRef = useRef(null);
  const centeredRef = useRef(false);

  // Touch device detection
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // Desktop detection - split-screen layout for desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  // Helper functions
  const formatCompactAddress = (addr, cityOrPostal) => {
    if (!addr && !cityOrPostal) return '';
    let streetPart = '';
    let postalPart = '';
    if (addr) {
      streetPart = addr.split(',')[0].trim();
    }
    if (cityOrPostal) {
      const postalMatch = String(cityOrPostal).match(/(\d{3,6})/);
      postalPart = postalMatch ? postalMatch[0] : String(cityOrPostal).split(',')[0].trim();
    }
    if (streetPart && postalPart) return `${streetPart}, ${postalPart}`;
    if (streetPart) return streetPart;
    return postalPart;
  };

  const compactFromFull = (full) => {
    if (!full) return '';
    const cleaned = String(full).replace(/<br\s*\/?[^>]*>/gi, ',').trim();
    if (!cleaned) return '';
    if (cleaned.includes(',')) {
      const parts = cleaned.split(',');
      const addr = parts[0].trim();
      const rest = parts.slice(1).join(',').trim();
      return formatCompactAddress(addr, rest);
    }
    if (cleaned.length > 40) return cleaned.slice(0, 37) + '...';
    return cleaned;
  };

  // Update dropdown position for mobile portal
  const updateDropdownPosition = () => {
    if (inputRef.current && isMobile) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const estimateDurationFromDistance = (meters, avgSpeedKmh = 50) => {
    if (!meters || meters <= 0) return null;
    const hours = meters / 1000 / avgSpeedKmh;
    return Math.round(hours * 3600);
  };

  // Map controls
  const handleZoomIn = () => {
    if (mapRef?.current?.zoomIn) mapRef.current.zoomIn();
  };
  
  const handleZoomOut = () => {
    if (mapRef?.current?.zoomOut) mapRef.current.zoomOut();
  };

  const handleLocateMe = () => {
    console.log('📍 Lociraj me kliknuto - tražim GPS lokaciju');

    if (!navigator.geolocation) {
      alert('Geolokacija nije podržana u ovom pregledniku.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('📍 GPS lokacija pronađena:', pos.coords);
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCurrentCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });

        try {
          if (mapRef?.current?.setView) mapRef.current.setView(coords, 17);
        } catch (err) {
          console.warn('Map setView not available', err);
        }

        if (onLocateMe) onLocateMe(coords);
      },
      (error) => {
        console.error('📍 GPS greška:', error);
        alert('Nije moguće dobiti lokaciju. Provjerite dozvole preglednika.');
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lon) => {
    setReverseGeocodingLoading(true);
    try {
      console.log('🔄 Starting reverse geocoding for:', lat, lon);

      // 1) Try Nominatim reverse geocoding
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=de,en&addressdetails=1`
        );

        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          console.log('🔄 Nominatim response:', nominatimData);

          if (nominatimData.display_name) {
            let address = nominatimData.display_name;

            // Try to create a shorter human-friendly address
            if (nominatimData.address) {
              const addr = nominatimData.address;
              let formattedAddr = '';

              if (addr.house_number && addr.road) {
                formattedAddr = `${addr.road} ${addr.house_number}`;
              } else if (addr.road) {
                formattedAddr = addr.road;
              }

              if (addr.postcode && addr.city) {
                formattedAddr += formattedAddr ? `, ${addr.postcode} ${addr.city}` : `${addr.postcode} ${addr.city}`;
              } else if (addr.city) {
                formattedAddr += formattedAddr ? `, ${addr.city}` : addr.city;
              }

              if (formattedAddr) address = formattedAddr;
            }

            setCurrentAddress(String(address));
            console.log('📍 Address found via Nominatim:', address);
            return;
          }
        }
      } catch (nominatimError) {
        console.warn('🔄 Nominatim failed:', nominatimError);
      }

      // 2) Fallback: VAO/VOR locmatch via proxy
      try {
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
            pos: { x: Math.round(lon * 1e6), y: Math.round(lat * 1e6), acc: 16.185 }
          },
          formatted: false,
          ext: 'VAO.22',
          svcReqL: [
            {
              meth: 'LocMatch',
              req: {
                input: {
                  field: 'S',
                  loc: { type: 'ALL', crd: { x: Math.round(lon * 1e6), y: Math.round(lat * 1e6) }, dist: 500 },
                  maxLoc: 3
                }
              },
              id: '1|43|'
            }
          ]
        };

        const vaoResponse = await fetch(`${ENV.API_BASE_URL}/vor-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(VAO_BODY)
        });

        console.debug('[MapCardModern] vor-proxy status:', vaoResponse.status);

        try {
          const text = await vaoResponse.text();
          console.debug('[MapCardModern] vor-proxy response (preview):', text ? text.slice(0, 1000) : '');
          const vaoData = text ? JSON.parse(text) : null;
          console.log('🔄 VAO response:', vaoData);

          if (
            vaoData &&
            Array.isArray(vaoData.svcResL) &&
            vaoData.svcResL[0] &&
            vaoData.svcResL[0].res &&
            vaoData.svcResL[0].res.match &&
            Array.isArray(vaoData.svcResL[0].res.match.locL)
          ) {
            const locations = vaoData.svcResL[0].res.match.locL;
            if (locations.length > 0) {
              const firstResult = locations[0];
              let address = '';

              if (firstResult.nameFormatted && firstResult.nameFormatted.text) {
                address = firstResult.nameFormatted.text.replace(/<[^>]*>/g, '');
              } else if (firstResult.name) {
                address = firstResult.name;
              }

              if (address) {
                setCurrentAddress(String(address));
                console.log('📍 Address found via VAO:', address);
                return;
              }
            }
          }
        } catch (vaoError) {
          console.warn('🔄 VAO fallback failed (parse/response):', vaoError);
        }
      } catch (vaoFetchError) {
        console.warn('🔄 VAO proxy request failed:', vaoFetchError);
      }

      // 3) Final fallback: coordinates
      console.log('📍 Using coordinates as final fallback');
      setCurrentAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } catch (error) {
      console.error('🔄 Reverse geocoding error:', error);
      // Fallback to coordinates
      setCurrentAddress(`${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    } finally {
      setReverseGeocodingLoading(false);
    }
  };

  // Fullscreen handling
  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      const elem = mapContentRef.current;
      if (elem?.requestFullscreen) {
        elem.requestFullscreen().then(() => {
          setIsFullscreen(true);
          // Na touch uređajima postavi umereni zoom (17 umesto 18)
          if (isTouchDevice) {
            setTimeout(() => {
              if (mapRef?.current?.setView && currentCoords) {
                mapRef.current.setView([currentCoords.lat, currentCoords.lon], 17);
              }
            }, 100);
          }
        });
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Battery-optimized GPS tracking
  useEffect(() => {
    const startGpsTracking = async () => {
      if (!navigator.geolocation) return;

      // Zaustavi postojeći watch ako postoji
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      try {
        // Dobij adaptivnu konfiguraciju na osnovu baterije
        const adaptiveConfig = await getAdaptiveConfig();
        
        console.log(`🔋 [GPS] Starting tracking in ${batteryMode} mode:`, adaptiveConfig);

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            setCurrentCoords(newCoords);
            setSpeed(position.coords.speed || 0);
            setHeading(position.coords.heading || 0);

            // Keep map centered on current location only in fullscreen, ali zadrži trenutni zoom
            if (isFullscreen && mapRef?.current?.setView) {
              const currentZoom = mapRef?.current?.getZoom ? mapRef.current.getZoom() : undefined;
              mapRef.current.setView([newCoords.lat, newCoords.lon], currentZoom);
            }
          },
          (error) => {
            console.error(`🔋 [GPS] Tracking error in ${batteryMode} mode:`, error);
          },
          adaptiveConfig
        );

        watchIdRef.current = watchId;
      } catch (error) {
        console.error('🔋 [GPS] Failed to start adaptive tracking:', error);
        // Fallback na osnovnu konfiguraciju
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newCoords = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            setCurrentCoords(newCoords);
            setSpeed(position.coords.speed || 0);
            setHeading(position.coords.heading || 0);

            if (isFullscreen && mapRef?.current?.setView) {
              const currentZoom = mapRef?.current?.getZoom ? mapRef.current.getZoom() : undefined;
              mapRef.current.setView([newCoords.lat, newCoords.lon], currentZoom);
            }
          },
          (error) => console.error('GPS tracking error:', error),
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
        watchIdRef.current = watchId;
      }
    };

    startGpsTracking();

    return () => {
      if (watchIdRef.current && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [batteryMode, isFullscreen]); // Restartuj tracking kada se promeni battery mode

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Debounced reverse geocoding when coordinates change
  useEffect(() => {
    if (currentCoords && currentCoords.lat && currentCoords.lon) {
      console.log('📍 Coordinates changed, starting debounced reverse geocoding:', currentCoords);
      debouncedReverseGeocode(currentCoords.lat, currentCoords.lon, speed);
    }
  }, [currentCoords, speed]);

  // Listen to debounced reverse geocoding results
  useEffect(() => {
    const listener = (event) => {
      if (event.type === 'result' && event.data) {
        const formatted = `${event.data.address}${event.data.city ? ', ' + event.data.city : ''}`;
        setCurrentAddress(formatted);
        console.log('📍 Address updated from debounced service:', formatted);
      } else if (event.type === 'error' && currentCoords) {
        // Fallback to local reverse geocoding when debounced service fails
        console.warn('📍 Debounced reverse geocoding failed, falling back to local service:', event.error);
        reverseGeocode(currentCoords.lat, currentCoords.lon);
      }
    };

    const unsubscribe = geoService.addListener(listener);
    return unsubscribe;
  }, [geoService, currentCoords]);

  // Compute driving route when we have both current location and a selected location
  useEffect(() => {
    let cancelled = false;

    const computeRoute = async () => {
      if (!currentCoords || !selectedLocation || !selectedLocation.lat || !selectedLocation.lon) return;
      try {
        setRouteLoading(true);
        // Use console.log so this is visible even when 'Verbose' log level isn't enabled
        console.log('🗺️ Computing route from', currentCoords, 'to', selectedLocation);
        const result = await getDrivingRouteInfo(currentCoords.lat, currentCoords.lon, selectedLocation.lat, selectedLocation.lon);
        if (cancelled) return;
        setRouteInfo(result || null);
      } catch (err) {
        console.warn('🗺️ Route computation failed:', err?.message || err);
        if (!cancelled) setRouteInfo(null);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    computeRoute();

    // Expose a manual trigger during debugging so you can invoke routing from Browser Console:
    // window.__triggerRoute()
    try {
       
      window.__triggerRoute = async () => {
        if (!currentCoords || !selectedLocation) {
          console.warn('window.__triggerRoute: missing currentCoords or selectedLocation', { currentCoords, selectedLocation });
          return;
        }
        console.log('window.__triggerRoute: invoking getDrivingRouteInfo', { currentCoords, selectedLocation });
        try {
          const res = await getDrivingRouteInfo(currentCoords.lat, currentCoords.lon, selectedLocation.lat, selectedLocation.lon);
          console.log('window.__triggerRoute result', res);
          return res;
        } catch (err) {
          console.error('window.__triggerRoute error', err);
          throw err;
        }
      };
    } catch (e) {
      /* ignore if window is not available */
    }

    return () => { cancelled = true; };
  }, [currentCoords, selectedLocation]);

  // Auto-locate on component mount
  useEffect(() => {
    if (autoLocate && !currentCoords && navigator.geolocation) {
      console.log('🚀 Auto-locating on component mount');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('📍 Auto-locate GPS found:', pos.coords);
          setCurrentCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          
          try {
            if (mapRef?.current?.setView) {
              mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
            }
          } catch (err) {
            console.warn('Map setView not available', err);
          }
        },
        (error) => {
          console.warn('📍 Auto-locate failed:', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }
  }, [autoLocate, currentCoords, mapRef]);

  // Watch for external address/city changes and update selectedLocation
  useEffect(() => {
    console.log('📍 Props changed - address:', address, 'city:', city, 'selectedMarker:', selectedMarker);
    
    // Always try to set selectedLocation if we have any data
    if (address || city || selectedMarker) {
      console.log('📍 Setting location from props:', { address, city, selectedMarker });
      
      // Extract coordinates from selectedMarker
      let lat = null;
      let lon = null;
      
      if (selectedMarker) {
        if (selectedMarker.lat !== undefined && selectedMarker.lon !== undefined) {
          lat = selectedMarker.lat;
          lon = selectedMarker.lon;
        } else if (selectedMarker.lat !== undefined && selectedMarker.lng !== undefined) {
          lat = selectedMarker.lat;
          lon = selectedMarker.lng;
        }
      }
      
      const selected = {
        address: address || '',
        city: city || '',
        lat: lat,
        lon: lon
      };
      
      // Only set if we have meaningful data
      if (selected.address || selected.city || (selected.lat && selected.lon)) {
        setSelectedLocation(selected);
        console.log('🎯 Selected location set from external props:', selected);
        
        // Also update input value to match
        const displayValue = (address || '') + (city ? `, ${city}` : '');
        if (displayValue.trim()) {
          setInputValue(displayValue.trim());
        }
      }
    } else {
      // Clear selection if no data
      console.log('📍 Clearing selected location - no data');
      setSelectedLocation(null);
      setInputValue('');
    }
  }, [address, city, selectedMarker]);

  // Update dropdown position for mobile
  useEffect(() => {
    const handleScrollResize = () => {
      if (isInputFocused && isMobile) {
        updateDropdownPosition();
      }
    };

    window.addEventListener('scroll', handleScrollResize);
    window.addEventListener('resize', handleScrollResize);
    
    return () => {
      window.removeEventListener('scroll', handleScrollResize);
      window.removeEventListener('resize', handleScrollResize);
    };
  }, [isInputFocused, isMobile]);

  // Search functionality
  const handleSearch = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const results = await searchAddresses(query);
      setSuggestions(results || []);
    } catch (error) {
      console.error('Greška pri pretraživanju:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (justSelectedSuggestion) {
      setJustSelectedSuggestion(false);
      return;
    }

    if (value.length >= 3) {
      handleSearch(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (location) => {
    console.log('🎯 Suggestion clicked:', location);
    const x = location.crd?.x;
    const y = location.crd?.y;
    
    if (typeof x === 'number' && typeof y === 'number' && mapRef?.current?.setView) {
      const lat = y / 1e6;
      const lon = x / 1e6;
      
      mapRef.current.setView([lat, lon], 17);
      
      let fullAddress = location.nameFormatted?.text || location.name || '';
      let addressPart = fullAddress;
      let cityPart = '';
      
      const brRegex = /<br\s*\/?.*?>/i;
      if (brRegex.test(fullAddress)) {
        const parts = fullAddress.split(brRegex);
        addressPart = parts[0].trim();
        cityPart = parts.slice(1).join(' ').trim();
      } else if (fullAddress.includes(',')) {
        const parts = fullAddress.split(',');
        addressPart = parts[0].trim();
        cityPart = parts.slice(1).join(',').trim();
      }
      
      const newInputValue = addressPart + (cityPart ? `, ${cityPart}` : '');
      setInputValue(newInputValue);
      
      const selected = { 
        address: addressPart, 
        city: cityPart, 
        lat, 
        lon,
        data: {
          nameFormatted: {
            text: fullAddress
          },
          name: addressPart
        },
        label: newInputValue
      };
      setSelectedLocation(selected);
      console.log('🎯 Selected location set:', selected);
      if (onSearchSelect) onSearchSelect(selected);
      
      setSuggestions([]);
      setJustSelectedSuggestion(true);
      setIsInputFocused(false);
      
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleNavigate = () => {
    if (inputValue.trim() && onNavigate) {
      onNavigate(inputValue.trim());
    }
  };

  // Style calculations
  const mapContentStyle = isFullscreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999
  } : {};

  // Main render
  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`} style={style}>
      {/* Desktop Split-Screen Layout */}
      {isDesktop && !isFullscreen ? (
        <div className="flex h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50">
          {/* Left Panel - Search and Info */}
          <div className="w-1/2 bg-gradient-to-b from-white via-slate-50 to-blue-50 border-r border-slate-200/50 flex flex-col backdrop-blur-sm">
            <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Navigacija
                </h2>
                <p className="text-slate-600">Pronađi rutu do odredišta</p>
              </div>

              {/* Search Section */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!justSelectedSuggestion) {
                              setIsInputFocused(false);
                            }
                          }, 200);
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-slate-500"
                        placeholder="Unesi adresu za navigaciju..."
                        autoComplete="off"
                      />
                      
                      {/* Suggestions Dropdown */}
                      {isInputFocused && (suggestions.length > 0 || loadingSuggestions) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-[3000]">
                          {loadingSuggestions ? (
                            <div className="p-4 flex items-center gap-3 text-slate-600">
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              Tražim adrese...
                            </div>
                          ) : suggestions.length === 0 ? (
                            <div className="p-4 text-slate-600">
                              Nema rezultata za "{inputValue}"
                            </div>
                          ) : (
                            suggestions.map((location, index) => (
                              <div
                                key={index}
                                className="p-4 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors duration-150"
                                onClick={() => handleSuggestionClick(location)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div className="font-medium text-slate-800">
                                  {location.nameFormatted?.text?.replace(/<[^>]*>/g, '') || location.name || ''}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Navigate Button */}
                    <button
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                      onClick={handleNavigate}
                      disabled={!inputValue.trim()}
                      title="Otvori navigaciju"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="space-y-4 flex-1">
                {/* Combined Route Info Display */}
                {selectedLocation ? (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-white/90 via-blue-50/30 to-purple-50/20 backdrop-blur-md border border-white/30 shadow-xl">
                    <div className="flex items-center justify-between gap-4">
                      {/* Address Info - Left Side */}
                      <div className="flex-1 space-y-2">
                        {/* Current Location */}
                        {currentAddress ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-green-50/60 backdrop-blur-sm border border-emerald-200/40">
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span className="text-sm font-medium text-slate-800 truncate" title={currentAddress}>
                              {currentAddress}
                            </span>
                          </div>
                        ) : currentCoords && typeof currentCoords.lat === 'number' && typeof currentCoords.lon === 'number' ? (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-green-50/60 backdrop-blur-sm border border-emerald-200/40">
                            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span className="text-sm font-medium text-slate-800 truncate" title={`${currentCoords.lat.toFixed(6)}, ${currentCoords.lon.toFixed(6)}`}>
                              {currentCoords.lat.toFixed(6)}, {currentCoords.lon.toFixed(6)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm border border-gray-200/40">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span className="text-sm font-medium text-slate-600 truncate">
                              Moja lokacija nije dostupna
                            </span>
                          </div>
                        )}

                        {/* Selected Location */}
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-rose-50/80 to-red-50/60 backdrop-blur-sm border border-rose-200/40">
                          <svg className="w-4 h-4 text-rose-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="6"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                          </svg>
                          <span className="text-sm font-medium text-slate-800 truncate" title={`${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}`}>
                            {`${String(selectedLocation.address)}${selectedLocation.city ? `, ${String(selectedLocation.city)}` : ''}`}
                          </span>
                        </div>
                      </div>

                      {/* Distance Info - Right Side */}
                      <div className="flex-shrink-0">
                        <div className="text-right bg-gradient-to-br from-blue-50/50 to-indigo-50/30 backdrop-blur-sm border border-blue-200/30 rounded-xl px-4 py-3">
                          <div className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {polylineAnalysis && typeof polylineAnalysis.compact === 'string' ? (
                              polylineAnalysis.compact
                            ) : routeInfo ? (
                              <>
                                {routeInfo.durationText || gmFormatDuration(routeInfo.durationSeconds) || '--'}
                                {` • `}
                                {routeInfo.distanceText || gmFormatDistance(routeInfo.distanceMeters) || '--'}
                              </>
                            ) : currentCoords && selectedLocation ? (
                              (() => {
                                const aerialKm = haversineKm(currentCoords.lat, currentCoords.lon, selectedLocation.lat, selectedLocation.lon);
                                const aerialMeters = Math.round(aerialKm * 1000);
                                const estSec = estimateDurationFromDistance(aerialMeters, 40);
                                return estSec ? (
                                  `${gmFormatDuration(estSec)} • ${gmFormatDistance(aerialMeters)}`
                                ) : '--';
                              })()
                            ) : (
                              '--'
                            )}
                            {routeLoading && (
                              <span className="ml-2">
                                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin inline-block"></div>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Current Location - when no route */}
                    {reverseGeocodingLoading ? (
                      <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📍</span>
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-slate-600 font-medium">Prepoznajem adresu...</span>
                          </div>
                        </div>
                      </div>
                    ) : currentAddress ? (
                      <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">�</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">Moja lokacija</h4>
                            <p className="text-sm text-slate-600">{currentAddress}</p>
                          </div>
                        </div>
                      </div>
                    ) : currentCoords && typeof currentCoords.lat === 'number' && typeof currentCoords.lon === 'number' ? (
                      <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">�</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1">Moja lokacija</h4>
                            <p className="text-sm text-slate-600">{currentCoords.lat.toFixed(6)}, {currentCoords.lon.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl opacity-60">📍</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-700 mb-1">Moja lokacija</h4>
                            <p className="text-sm text-slate-500">Lokacija nije dostupna</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Selected Address - when no route */}
                    {selectedLocation && !currentAddress && (
                      <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🎯</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">Odabrana adresa</h4>
                            <p className="text-sm text-gray-600">{`${String(selectedLocation.address)}${selectedLocation.city ? `, ${String(selectedLocation.city)}` : ''}`}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search Input Display */}
                    {inputValue && !selectedLocation && (
                      <div className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🔍</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">Pretraživanje</h4>
                            <p className="text-sm text-gray-600">{inputValue}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Map */}
          <div className="w-1/2 relative">
            <div ref={mapContentRef} className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 overflow-hidden" style={mapContentStyle}>
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="text-slate-700 font-medium text-lg">Učitavam mapu...</p>
                </div>
              ) : (
                <>
                  {/* Inject computed routeInfo and userLocation into children (e.g. MapView) so popups use real route data */}
                  {(() => {
                    return React.Children.map(children, (child) => {
                      if (React.isValidElement(child)) {
                        const userLocation = currentCoords ? [currentCoords.lat, currentCoords.lon] : child.props.userLocation || null;
                        return React.cloneElement(child, {
                          routeInfo: routeInfo || child.props.routeInfo || null,
                          userLocation: userLocation,
                          selectedMarker: selectedLocation || child.props.selectedMarker || null,
                          speed: speed || child.props.speed || 0,
                          heading: heading || child.props.heading || 0,
                          isFullscreen: isFullscreen || child.props.isFullscreen || false
                        });
                      }
                      return child;
                    });
                  })()}
                  
                  {/* Map Controls */}
                  <div className="absolute right-6 top-20 flex flex-col gap-3 z-30">
                    <button 
                      className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white group" 
                      onClick={handleZoomIn} 
                      title="Povećaj zoom"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                        <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                      </svg>
                    </button>

                    <button 
                      className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white group" 
                      onClick={handleZoomOut} 
                      title="Smanji zoom"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                        <path d="M19 11H5v2h14z"/>
                      </svg>
                    </button>

                    <button 
                      className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-emerald-600 hover:bg-white group" 
                      onClick={handleLocateMe} 
                      title="Lociraj me"
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                      </svg>
                    </button>

                    {/* Fullscreen for touch devices */}
                    {isTouchDevice && (
                      <button
                        className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white border border-purple-400/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center hover:from-purple-600 hover:to-purple-700 group"
                        onClick={handleFullscreenToggle}
                        title={isFullscreen ? "Izađi iz punog ekrana" : "Puni ekran"}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                          {isFullscreen ? (
                            <path d="M18 7h-3V4h-2v3H10V4H8v3H5v2h3v3H5v2h3v3h2v-3h3v3h2v-3h3v-2h-3V9h3V7z"/>
                          ) : (
                            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                          )}
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Current Location Marker - sada se koristi UserLocationMarker u MapView */}
                  {/* HTML overlay marker uklonjen jer koristimo pravi Leaflet marker */}

                  {/* Speed Display */}
                  <div className="absolute right-6 bottom-6 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-2xl px-4 py-3 shadow-xl z-1000">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
                      <span className="font-bold text-lg text-slate-800">{speed ? (speed * 3.6).toFixed(1) : '0'}</span>
                      <span className="text-sm text-slate-700 font-medium">km/h</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Mobile/Tablet/Sidebar Layout */
        <div className={`relative ${isFullscreen ? 'fixed inset-0' : 'min-h-[300px] h-full'} ${hideSearchAndInfo && isMobile ? 'bg-white' : 'bg-gradient-to-br from-slate-100 via-white to-blue-50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20'} overflow-hidden`}>
          {/* Modern Header - samo prikaži ako nije hideSearchAndInfo ili nije mobilna verzija */}
          {(!hideSearchAndInfo || !isMobile) && (
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-6 backdrop-blur-sm">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                {title && <h3 className="text-2xl font-bold mb-2 text-center">{title}</h3>}
                
                {/* Search Bar - samo prikaži ako nije hideSearchAndInfo */}
                {!hideSearchAndInfo && (
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => {
                          setIsInputFocused(true);
                          updateDropdownPosition();
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!justSelectedSuggestion) {
                              setIsInputFocused(false);
                            }
                          }, 200);
                        }}
                        className="w-full px-4 py-3 rounded-2xl border border-white/30 bg-white/90 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-white focus:border-white outline-none transition-all duration-200 text-slate-800 placeholder-slate-500"
                        placeholder="Unesi adresu za navigaciju..."
                        autoComplete="off"
                      />
                    </div>
                    
                    <button
                      className="px-6 py-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      onClick={handleNavigate}
                      disabled={!inputValue.trim()}
                      title="Otvori navigaciju"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map Content */}
          <div ref={mapContentRef} className="flex-1 relative min-h-[500px] h-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 w-full box-border overflow-hidden" style={mapContentStyle}>
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-20">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-slate-700 font-medium text-lg">Učitavam mapu...</p>
              </div>
            ) : (
              <>
                {/* Inject computed routeInfo and userLocation into children (e.g. MapView) so popups use real route data */}
                {(() => {
                  return React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      const userLocation = currentCoords ? [currentCoords.lat, currentCoords.lon] : child.props.userLocation || null;
                      return React.cloneElement(child, {
                        routeInfo: routeInfo || child.props.routeInfo || null,
                        userLocation: userLocation,
                        selectedMarker: selectedLocation || child.props.selectedMarker || null,
                        speed: speed || child.props.speed || 0,
                        heading: heading || child.props.heading || 0,
                        isFullscreen: isFullscreen || child.props.isFullscreen || false
                      });
                    }
                    return child;
                  });
                })()}
                
                {/* Current Address Display - Center Top (when fullscreen) */}
                {isFullscreen && currentAddress && (() => {
                  // Extract street name and number from full address
                  const getStreetAndNumber = (fullAddress) => {
                    if (!fullAddress) return '';
                    
                    // Split by comma and take the first part (usually street + number)
                    const firstPart = fullAddress.split(',')[0].trim();
                    
                    // Remove common prefixes and clean up
                    const cleaned = firstPart
                      .replace(/^(Adresa:|Address:|Lokacija:|Location:)/i, '')
                      .trim();
                    
                    return cleaned || fullAddress;
                  };

                  const streetDisplay = getStreetAndNumber(currentAddress);

                  return (
                    <div className="absolute left-0 right-0 top-4 z-40">
                      <div className="mx-4 bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-lg">📍</span>
                          <p className="text-base font-bold text-slate-800 truncate">{streetDisplay}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Left Side Controls - Search (when hideSearchAndInfo is active) */}
                {hideSearchAndInfo && isMobile && (
                  <div className="absolute left-6 top-20 flex flex-col gap-3 z-30">
                    <button
                      className="w-12 h-12 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white group"
                      onClick={() => {
                        setIsInputFocused(!isInputFocused);
                        if (!isInputFocused) {
                          updateDropdownPosition();
                          // Focus the input if it exists
                          setTimeout(() => {
                            if (inputRef.current) {
                              inputRef.current.focus();
                            }
                          }, 100);
                        }
                      }}
                      title="Pretraži lokaciju"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:scale-110 transition-transform">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="M21 21l-4.35-4.35"></path>
                      </svg>
                    </button>
                  </div>
                )}

                {/* Floating Search Input (when hideSearchAndInfo is active and search is focused) */}
                {hideSearchAndInfo && isMobile && isInputFocused && (
                  <div className="absolute left-20 top-6 right-6 z-40">
                    <div className="h-12 bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl overflow-hidden">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!justSelectedSuggestion) {
                              setIsInputFocused(false);
                            }
                          }, 200);
                        }}
                        className="w-full h-full px-4 text-sm border-0 bg-transparent focus:ring-0 focus:outline-none text-slate-800 placeholder-slate-500"
                        placeholder="Unesi adresu za navigaciju..."
                        autoComplete="off"
                      />
                    </div>
                  </div>
                )}

                {/* Map Controls */}
                <div className="absolute right-6 top-20 flex flex-col gap-3 z-30">
                  <button 
                    className={`${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'} bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white group`}
                    onClick={handleZoomIn} 
                    title="Povećaj zoom"
                  >
                    <svg width={isFullscreen ? "26" : "22"} height={isFullscreen ? "26" : "22"} viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
                    </svg>
                  </button>

                  <button 
                    className={`${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'} bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white group`}
                    onClick={handleZoomOut} 
                    title="Smanji zoom"
                  >
                    <svg width={isFullscreen ? "26" : "22"} height={isFullscreen ? "26" : "22"} viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M19 11H5v2h14z"/>
                    </svg>
                  </button>

                  <button 
                    className={`${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'} bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-slate-700 hover:text-emerald-600 hover:bg-white group`}
                    onClick={handleLocateMe} 
                    title="Lociraj me"
                  >
                    <svg width={isFullscreen ? "26" : "22"} height={isFullscreen ? "26" : "22"} viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                    </svg>
                  </button>

                  {/* Fullscreen - only on touch devices */}
                  {isTouchDevice && (
                    <button
                      className={`${isFullscreen ? 'w-14 h-14' : 'w-12 h-12'} bg-gradient-to-br from-purple-500 to-purple-600 text-white border border-purple-400/50 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center hover:from-purple-600 hover:to-purple-700 group`}
                      onClick={handleFullscreenToggle}
                      title={isFullscreen ? "Izađi iz punog ekrana" : "Puni ekran"}
                    >
                      <svg width={isFullscreen ? "24" : "20"} height={isFullscreen ? "24" : "20"} viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
                        {isFullscreen ? (
                          <path d="M18 7h-3V4h-2v3H10V4H8v3H5v2h3v3H5v2h3v3h2v-3h3v3h2v-3h3v-2h-3V9h3V7z"/>
                        ) : (
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                        )}
                      </svg>
                    </button>
                  )}
                </div>

                {/* Current Location Marker - sada se koristi UserLocationMarker u MapView */}
                {/* HTML overlay marker uklonjen jer koristimo pravi Leaflet marker */}

                {/* Speed Display */}
                <div className="absolute right-6 bottom-6 bg-white/95 backdrop-blur-sm border border-slate-300 rounded-2xl px-4 py-3 shadow-xl z-1000">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-blue-500"></div>
                    <span className="font-bold text-lg text-slate-800">{speed ? (speed * 3.6).toFixed(1) : '0'}</span>
                    <span className="text-sm text-slate-700 font-medium">km/h</span>
                  </div>
                </div>
              </>
            )}

            {/* Mobile Info Footer - sticky na dnu mape - samo prikaži ako nije hideSearchAndInfo */}
            {!isDesktop && !hideSearchAndInfo && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/90 to-transparent backdrop-blur-sm border-t border-white/20 p-4 space-y-2">
                {/* Current Location */}
                {currentCoords ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-blue-50/80 to-indigo-50/60 backdrop-blur-sm border border-blue-200/40">
                    <svg className="w-4 h-4 text-blue-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-xs font-medium text-slate-800 truncate">Moja lokacija: {currentCoords.lat.toFixed(4)}, {currentCoords.lon.toFixed(4)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-gray-50/80 to-slate-50/60 backdrop-blur-sm border border-gray-200/40">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-xs font-medium text-slate-600 truncate">Moja lokacija nije dostupna</span>
                  </div>
                )}

                {/* Selected Location */}
                {selectedLocation && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-rose-50/80 to-red-50/60 backdrop-blur-sm border border-rose-200/40">
                    <svg className="w-4 h-4 text-rose-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="6"></circle>
                      <circle cx="12" cy="12" r="2"></circle>
                    </svg>
                    <span className="text-xs font-medium text-slate-800 truncate" title={`${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}`}>
                      {`${selectedLocation.address}${selectedLocation.city ? `, ${selectedLocation.city}` : ''}`}
                    </span>
                  </div>
                )}

                {/* Input Value Display */}
                {inputValue && !selectedLocation && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-amber-50/80 to-yellow-50/60 backdrop-blur-sm border border-amber-200/40">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <span className="text-xs font-medium text-slate-800 truncate">Pretraživanje: {inputValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info Panel */}
          {sidebarLayout && (
            <div className="w-80 bg-gradient-to-b from-white via-slate-50 to-blue-50 border-l border-slate-200/50 flex flex-col backdrop-blur-sm">
              <div ref={footerRef} className="p-6 flex flex-col gap-4 h-full">
                <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Informacije
                </h3>
                <div className="flex flex-col gap-4 flex-1">
                  {/* Info cards would go here */}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Suggestions Portal - Displayed outside parent containers - samo ako nije hideSearchAndInfo ili je hideSearchAndInfo ali je search aktivan */}
      {isMobile && ((!hideSearchAndInfo && isInputFocused) || (hideSearchAndInfo && isInputFocused)) && (suggestions.length > 0 || loadingSuggestions) && createPortal(
        <div 
          className={`fixed bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[99999]`}
          style={{
            top: hideSearchAndInfo ? 'calc(1.5rem + 48px + 8px)' : dropdownPosition.top,
            left: hideSearchAndInfo ? '5rem' : dropdownPosition.left,
            right: hideSearchAndInfo ? '1.5rem' : 'auto',
            width: hideSearchAndInfo ? 'auto' : dropdownPosition.width
          }}
        >
          {loadingSuggestions ? (
            <div className="p-3 flex items-center gap-2 text-slate-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Tražim adrese...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-slate-600 text-sm">
              Nema rezultata za "{inputValue}"
            </div>
          ) : (
            suggestions.map((location, index) => (
              <div
                key={index}
                className="p-3 hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors duration-150"
                onClick={() => handleSuggestionClick(location)}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="font-medium text-slate-800 text-sm">
                  {location.nameFormatted?.text?.replace(/<[^>]*>/g, '') || location.name || ''}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {location.district || location.region || location.country || ''}
                </div>
              </div>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MapCardModern;