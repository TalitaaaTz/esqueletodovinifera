import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { gpsService, type GeoPosition } from '@/services/gpsService';

interface UseGPSOptions {
  enableHighAccuracy?: boolean;
  throttleMs?: number;
  autoStart?: boolean;
}

interface UseGPSReturn {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
  refresh: () => Promise<void>;
}

// Detect mobile for adaptive throttling
const isMobile = typeof navigator !== 'undefined' && 
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function useGPS(options: UseGPSOptions = {}): UseGPSReturn {
  // Adaptive throttle: 2s on mobile (saves battery + reduces re-renders), 1s desktop
  const adaptiveThrottle = useMemo(() => 
    options.throttleMs ?? (isMobile ? 2000 : 1000), 
    [options.throttleMs]
  );
  
  const { enableHighAccuracy = true, autoStart = true } = options;
  
  const [position, setPosition] = useState<GeoPosition | null>(
    gpsService.getLastPosition()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isStartedRef = useRef(false);

  const start = useCallback(() => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;

    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      setLoading(false);
      return;
    }

    gpsService.startWatching({
      enableHighAccuracy,
      throttleMs: adaptiveThrottle,
      maxAge: isMobile ? 10000 : 5000, // Longer cache on mobile
      timeout: isMobile ? 15000 : 10000,
    });
  }, [enableHighAccuracy, adaptiveThrottle]);

  const stop = useCallback(() => {
    isStartedRef.current = false;
    gpsService.stopWatching();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const pos = await gpsService.getCurrentPosition();
      setPosition(pos);
      setError(null);
    } catch (e) {
      console.error('Failed to refresh position:', e);
    }
  }, []);

  useEffect(() => {
    // Subscribe to position updates
    const unsubscribePosition = gpsService.subscribe((pos) => {
      setPosition(pos);
      setLoading(false);
      setError(null);
    });

    // Subscribe to errors
    const unsubscribeError = gpsService.subscribeError((err) => {
      setLoading(false);
      switch (err.code) {
        case err.PERMISSION_DENIED:
          setError('Permissão de GPS negada');
          break;
        case err.POSITION_UNAVAILABLE:
          setError('GPS indisponível');
          break;
        case err.TIMEOUT:
          setError('Tempo esgotado');
          break;
        default:
          setError('Erro ao obter localização');
      }
    });

    // Auto-start if enabled
    if (autoStart) {
      start();
    }

    // Check for cached position
    const cached = gpsService.getLastPosition();
    if (cached) {
      setPosition(cached);
      setLoading(false);
    }

    return () => {
      unsubscribePosition();
      unsubscribeError();
    };
  }, [autoStart, start]);

  return {
    position,
    loading,
    error,
    start,
    stop,
    refresh,
  };
}

export default useGPS;
