import { useState, useCallback, useRef, useEffect } from 'react';
import { routeWorkerService, type RouteResult } from '@/services/routeWorkerService';
import { routeCacheService } from '@/services/routeCacheService';

interface UseRouteCalculationReturn {
  route: RouteResult | null;
  loading: boolean;
  error: string | null;
  isRecalculating: boolean;
  calculateRoute: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => Promise<void>;
  clearRoute: () => void;
}

export function useRouteCalculation(): UseRouteCalculationReturn {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Load last cached route on mount
  useEffect(() => {
    const lastRoute = routeCacheService.getLastRoute();
    if (lastRoute) {
      setRoute({
        geometry: lastRoute.geometry,
        distance: lastRoute.distance,
        duration: lastRoute.duration,
      });
    }
  }, []);

  const calculateRoute = useCallback(async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => {
    // Check if we already have a route (for recalculation indication)
    const hadPreviousRoute = route !== null;
    
    if (hadPreviousRoute) {
      setIsRecalculating(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      const result = await routeWorkerService.calculateRoute(origin, destination);
      setRoute(result);
      retryCountRef.current = 0;
    } catch (err) {
      console.error('Route calculation error:', err);
      
      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setError('Recalculando rota…');
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
        
        setTimeout(() => {
          calculateRoute(origin, destination);
        }, delay);
        
        return;
      }
      
      setError('Não foi possível calcular a rota. Verifique sua conexão.');
      retryCountRef.current = 0;
    } finally {
      setLoading(false);
      setIsRecalculating(false);
    }
  }, [route]);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
    setLoading(false);
    setIsRecalculating(false);
    retryCountRef.current = 0;
  }, []);

  return {
    route,
    loading,
    error,
    isRecalculating,
    calculateRoute,
    clearRoute,
  };
}

export default useRouteCalculation;
