import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  LocateFixed, 
  Clock, 
  Route,
  X,
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GeoPosition {
  lat: number;
  lng: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  geometry: [number, number][];
}

interface NavigationMapCardProps {
  cargoStatus?: 'saudavel' | 'atencao' | 'critico';
}

export const NavigationMapCard = ({ cargoStatus = 'saudavel' }: NavigationMapCardProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [currentLocation, setCurrentLocation] = useState<GeoPosition | null>(null);
  const [destination, setDestination] = useState<GeoPosition | null>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize map only when GPS is ready and we have a location
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || gpsLoading) return;

    // Small delay to ensure container is rendered
    const initTimeout = setTimeout(() => {
      if (!mapContainerRef.current) return;
      
      const initialCenter = currentLocation 
        ? [currentLocation.lat, currentLocation.lng] as [number, number]
        : [-23.5505, -46.6333] as [number, number];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true
      }).setView(initialCenter, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapRef.current = map;

      // Force map to recalculate size after render
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }, 50);

    return () => {
      clearTimeout(initTimeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [gpsLoading, currentLocation]);

  // Update map when location changes
  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    // Update or create origin marker
    if (originMarkerRef.current) {
      originMarkerRef.current.setLatLng([currentLocation.lat, currentLocation.lng]);
    } else {
      originMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], { icon: originIcon })
        .addTo(mapRef.current);
    }

    // Center map if no route
    if (!routeInfo) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  }, [currentLocation, routeInfo]);

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (destination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng([destination.lat, destination.lng]);
      } else {
        destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { icon: destinationIcon })
          .addTo(mapRef.current);
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
  }, [destination]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeInfo && routeInfo.geometry.length > 0) {
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(routeInfo.geometry);
      } else {
        routePolylineRef.current = L.polyline(routeInfo.geometry, {
          color: '#6366f1',
          weight: 5,
          opacity: 0.8
        }).addTo(mapRef.current);
      }

      // Fit bounds to route
      const bounds = L.latLngBounds(routeInfo.geometry);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
  }, [routeInfo]);

  // Start watching GPS location
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      setGpsLoading(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsLoading(false);
        setError(null);
      },
      (err) => {
        setGpsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permissão de GPS negada');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('GPS indisponível');
            break;
          default:
            setError('Erro ao obter localização');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Search for address using Nominatim
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (destinationInput.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(destinationInput);
      }, 500);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [destinationInput, searchAddress]);

  // Calculate route using OSRM
  const calculateRoute = useCallback(async (origin: GeoPosition, dest: GeoPosition) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.code === 'Ok' && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
        
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
          geometry
        });
      } else {
        setError('Não foi possível calcular a rota');
      }
    } catch (err) {
      console.error('Route error:', err);
      setError('Erro ao calcular rota');
    } finally {
      setLoading(false);
    }
  }, []);

  // Select destination from search results
  const selectDestination = (result: any) => {
    const dest = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setDestination(dest);
    setDestinationInput(result.display_name.split(',').slice(0, 2).join(', '));
    setSearchResults([]);

    if (currentLocation) {
      calculateRoute(currentLocation, dest);
    }
  };

  // Clear navigation
  const clearNavigation = () => {
    setDestination(null);
    setDestinationInput('');
    setRouteInfo(null);
    setSearchResults([]);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Format distance
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Get cargo status color
  const getStatusColor = () => {
    switch (cargoStatus) {
      case 'saudavel': return 'bg-green-500';
      case 'atencao': return 'bg-amber-500';
      case 'critico': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusText = () => {
    switch (cargoStatus) {
      case 'saudavel': return 'Carga Saudável';
      case 'atencao': return 'Atenção';
      case 'critico': return 'Crítico';
      default: return 'Desconhecido';
    }
  };

  if (gpsLoading) {
    return (
      <Card className="overflow-hidden flex items-center justify-center bg-muted/30" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium">Obtendo localização GPS...</p>
        </div>
      </Card>
    );
  }

  if (error && !currentLocation) {
    return (
      <Card className="overflow-hidden flex items-center justify-center bg-muted/30" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
        <div className="text-center px-4">
          <MapPin className="h-12 w-12 mb-3 opacity-30 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Verifique as permissões de localização
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <LocateFixed className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
      {/* Map */}
      <div className="flex-1 relative rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        <div ref={mapContainerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

        {/* GPS indicator */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium shadow-lg">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          GPS Ativo
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-background/50 flex items-center justify-center">
            <div className="bg-background rounded-lg p-4 shadow-lg flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">Calculando rota...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Panel */}
      <Card className="absolute bottom-0 left-0 right-0 z-[1000] rounded-t-2xl rounded-b-none border-b-0 shadow-2xl">
        {/* Toggle handle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background border rounded-full p-1 shadow-md"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        <CardContent className={`pt-4 pb-4 transition-all ${isExpanded ? '' : 'py-2'}`}>
          {isExpanded && (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Para onde você vai?"
                      value={destinationInput}
                      onChange={(e) => setDestinationInput(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {destinationInput && (
                      <button
                        onClick={clearNavigation}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectDestination(result)}
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-start gap-2 border-b last:border-b-0"
                      >
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="text-sm line-clamp-2">{result.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearching && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 p-3 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Route Info & Status */}
          <div className="grid grid-cols-3 gap-3">
            {/* ETA */}
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
              <Clock className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-bold">
                {routeInfo ? formatDuration(routeInfo.duration) : '--'}
              </span>
              <span className="text-xs text-muted-foreground">Tempo</span>
            </div>

            {/* Distance */}
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
              <Route className="h-5 w-5 text-primary mb-1" />
              <span className="text-lg font-bold">
                {routeInfo ? formatDistance(routeInfo.distance) : '--'}
              </span>
              <span className="text-xs text-muted-foreground">Distância</span>
            </div>

            {/* Cargo Status */}
            <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl">
              <div className={`w-5 h-5 rounded-full ${getStatusColor()} mb-1`} />
              <span className="text-sm font-semibold truncate w-full text-center">
                {getStatusText()}
              </span>
              <span className="text-xs text-muted-foreground">Carga</span>
            </div>
          </div>

          {/* Current coordinates */}
          {currentLocation && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Navigation className="h-3 w-3" />
              <span className="font-mono">
                {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NavigationMapCard;
