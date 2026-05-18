import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  LocateFixed, 
  ChevronUp,
  ChevronDown,
  AlertTriangle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Services and hooks
import { useGPS } from '@/hooks/useGPS';
import { useRouteCalculation } from '@/hooks/useRouteCalculation';

// Components
import { NavigationSkeleton } from './NavigationSkeleton';
import { SearchPanel } from './SearchPanel';
import { RouteInfoPanel } from './RouteInfoPanel';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons - created once, reused
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

// Route style
const ROUTE_STYLE: L.PolylineOptions = {
  color: '#6366f1',
  weight: 5,
  opacity: 0.8,
  smoothFactor: 1.5, // Smoother rendering
};

interface NavigationMapCardProps {
  cargoStatus?: 'saudavel' | 'atencao' | 'critico';
}

export const NavigationMapCard = memo(function NavigationMapCard({ 
  cargoStatus = 'saudavel' 
}: NavigationMapCardProps) {
  // Refs for map elements
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const isMapInitialized = useRef(false);

  // GPS hook with adaptive throttled updates (2s mobile, 1s desktop)
  const { position, loading: gpsLoading, error: gpsError } = useGPS({
    enableHighAccuracy: true,
  });

  // Route calculation with caching and Web Worker
  const { 
    route, 
    loading: routeLoading, 
    error: routeError,
    isRecalculating,
    calculateRoute, 
    clearRoute 
  } = useRouteCalculation();

  // Local state
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationName, setDestinationName] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map only once when GPS is ready
  useEffect(() => {
    if (!mapContainerRef.current || isMapInitialized.current || gpsLoading) return;
    if (!position) return;

    const initMap = () => {
      if (!mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: true, // Better performance for markers
      }).setView([position.lat, position.lng], 15);

      // Use cached tiles with aggressive caching for mobile
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OSM',
        maxZoom: 18, // Reduced for performance
        updateWhenIdle: true, // Don't update tiles while panning
        updateWhenZooming: false, // Smoother zoom
        keepBuffer: 2, // Reduced buffer for mobile memory
        maxNativeZoom: 18,
      }).addTo(map);

      // Add origin marker
      originMarkerRef.current = L.marker([position.lat, position.lng], { 
        icon: originIcon,
        zIndexOffset: 1000, // Always on top
      }).addTo(map);

      mapRef.current = map;
      isMapInitialized.current = true;

      // Force recalculate size after render
      requestAnimationFrame(() => {
        map.invalidateSize();
        setMapReady(true);
      });
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(initMap, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [gpsLoading, position]);

  // Update origin marker position (only marker, not map view) - debounced for mobile
  useEffect(() => {
    if (!mapRef.current || !position || !originMarkerRef.current) return;

    // Use requestAnimationFrame to batch marker updates
    requestAnimationFrame(() => {
      if (!originMarkerRef.current || !mapRef.current) return;
      
      // Update marker position without affecting map view
      originMarkerRef.current.setLatLng([position.lat, position.lng]);

      // Only center map if no route is displayed (less frequent)
      if (!route) {
        mapRef.current.setView([position.lat, position.lng], mapRef.current.getZoom(), {
          animate: false, // Disable animation on mobile for performance
        });
      }
    });
  }, [position, route]);

  // Update destination marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (destination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng([destination.lat, destination.lng]);
      } else {
        destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { 
          icon: destinationIcon 
        }).addTo(mapRef.current);
      }
    } else if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }
  }, [destination]);

  // Update route polyline (optimized)
  useEffect(() => {
    if (!mapRef.current) return;

    if (route && route.geometry.length > 0) {
      if (routePolylineRef.current) {
        // Update existing polyline instead of recreating
        routePolylineRef.current.setLatLngs(route.geometry);
      } else {
        // Create new polyline
        routePolylineRef.current = L.polyline(route.geometry, ROUTE_STYLE)
          .addTo(mapRef.current);
      }

      // Fit bounds with animation
      const bounds = L.latLngBounds(route.geometry);
      mapRef.current.fitBounds(bounds, { 
        padding: [50, 50],
        animate: true,
        duration: 0.5,
      });
    } else if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
  }, [route]);

  // Handle destination selection
  const handleSelectDestination = useCallback((lat: number, lng: number, name: string) => {
    setDestination({ lat, lng });
    setDestinationName(name);

    if (position) {
      calculateRoute(
        { lat: position.lat, lng: position.lng },
        { lat, lng }
      );
    }
  }, [position, calculateRoute]);

  // Handle clear navigation
  const handleClearNavigation = useCallback(() => {
    setDestination(null);
    setDestinationName('');
    clearRoute();
  }, [clearRoute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Loading state - show skeleton
  if (gpsLoading) {
    return <NavigationSkeleton variant="gps" />;
  }

  // Error state
  if (gpsError && !position) {
    return (
      <Card 
        className="overflow-hidden flex items-center justify-center bg-muted/30" 
        style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
      >
        <div className="text-center px-4">
          <MapPin className="h-12 w-12 mb-3 opacity-30 text-destructive mx-auto" />
          <p className="text-sm font-medium text-destructive">{gpsError}</p>
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
    <div 
      className="relative flex flex-col" 
      style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}
    >
      {/* Map Container */}
      <div className="flex-1 relative rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        <div 
          ref={mapContainerRef} 
          className="absolute inset-0" 
          style={{ width: '100%', height: '100%' }} 
        />

        {/* GPS indicator */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium shadow-lg">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          GPS Ativo
        </div>

        {/* Route loading overlay */}
        {routeLoading && !route && (
          <div className="absolute inset-0 z-[1000] bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <NavigationSkeleton variant="route" />
          </div>
        )}

        {/* Recalculating indicator */}
        {isRecalculating && (
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-warning text-warning-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Recalculando rota…
          </div>
        )}

        {/* Route error */}
        {routeError && !isRecalculating && (
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
            <AlertTriangle className="h-3 w-3" />
            {routeError}
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
            <div className="mb-4">
              <SearchPanel
                value={destinationName}
                onSelectDestination={handleSelectDestination}
                onClear={handleClearNavigation}
              />
            </div>
          )}

          {/* Route Info & Status */}
          <RouteInfoPanel
            duration={route?.duration ?? null}
            distance={route?.distance ?? null}
            cargoStatus={cargoStatus}
            isRecalculating={isRecalculating}
          />

          {/* Current coordinates */}
          {position && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Navigation className="h-3 w-3" />
              <span className="font-mono">
                {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default NavigationMapCard;
