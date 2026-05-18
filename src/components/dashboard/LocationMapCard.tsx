import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, LocateFixed } from 'lucide-react';

interface LocationMapCardProps {
  latitude?: number | null;
  longitude?: number | null;
  useRealLocation?: boolean;
}

interface GeoPosition {
  lat: number;
  lng: number;
}

export const LocationMapCard = ({ 
  latitude: propLatitude, 
  longitude: propLongitude,
  useRealLocation = true 
}: LocationMapCardProps) => {
  const [realLocation, setRealLocation] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Use real location or props
  const latitude = useRealLocation && realLocation ? realLocation.lat : propLatitude;
  const longitude = useRealLocation && realLocation ? realLocation.lng : propLongitude;
  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  const startWatchingLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setRealLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permissão de localização negada');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Localização indisponível');
            break;
          case err.TIMEOUT:
            setError('Tempo esgotado');
            break;
          default:
            setError('Erro ao obter localização');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    setWatchId(id);
  };

  useEffect(() => {
    if (useRealLocation) {
      startWatchingLocation();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [useRealLocation]);

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  // Using OpenStreetMap embed (free, no API key required)
  const osmEmbedUrl = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.01},${latitude! - 0.01},${longitude! + 0.01},${latitude! + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Localização em Tempo Real
          </div>
          {useRealLocation && realLocation && (
            <span className="flex items-center gap-1 text-xs font-normal text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              GPS Ativo
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
            <Loader2 className="h-10 w-10 mb-3 animate-spin text-primary" />
            <p className="text-sm font-medium">Obtendo localização...</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde enquanto o GPS é ativado</p>
          </div>
        ) : error ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 px-4">
            <MapPin className="h-12 w-12 mb-3 opacity-30 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-center mt-1 mb-4">
              Verifique as permissões de localização do seu navegador
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={startWatchingLocation}
              className="gap-2"
            >
              <LocateFixed className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : hasLocation ? (
          <div className="relative">
            <iframe
              src={osmEmbedUrl!}
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              title="Sua localização"
              className="w-full"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/80 to-transparent p-4 pt-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="h-4 w-4 text-primary" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                  </span>
                </div>
                <a
                  href={googleMapsUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Abrir no Maps →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
            <MapPin className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">GPS não disponível</p>
            <p className="text-xs mb-4">Aguardando dados de localização...</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={startWatchingLocation}
              className="gap-2"
            >
              <LocateFixed className="h-4 w-4" />
              Ativar GPS
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
