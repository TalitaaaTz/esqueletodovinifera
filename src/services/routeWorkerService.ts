/**
 * Route Worker Service - Manages Web Worker for route calculation
 */

import { routeCacheService, type CachedRoute } from './routeCacheService';

export interface RouteResult {
  geometry: [number, number][];
  distance: number;
  duration: number;
}

type RouteCallback = (result: RouteResult | null, error?: string) => void;

class RouteWorkerService {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, RouteCallback> = new Map();
  private requestId: number = 0;
  private isWorkerSupported: boolean = typeof Worker !== 'undefined';

  constructor() {
    if (this.isWorkerSupported) {
      this.initWorker();
    }
  }

  private initWorker(): void {
    try {
      this.worker = new Worker('/workers/routeWorker.js');
      
      this.worker.onmessage = (e) => {
        const { id, success, route, error } = e.data;
        const callback = this.pendingRequests.get(id);
        
        if (callback) {
          this.pendingRequests.delete(id);
          
          if (success && route) {
            callback(route);
          } else {
            callback(null, error || 'Unknown error');
          }
        }
      };

      this.worker.onerror = (e) => {
        console.error('Route worker error:', e);
        // Fallback to main thread calculation
        this.isWorkerSupported = false;
      };
    } catch (e) {
      console.warn('Failed to initialize route worker:', e);
      this.isWorkerSupported = false;
    }
  }

  /**
   * Calculate route (uses cache first, then worker or fallback)
   */
  async calculateRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteResult> {
    // Check cache first
    const cached = routeCacheService.getRoute(origin, destination);
    if (cached) {
      return {
        geometry: cached.geometry,
        distance: cached.distance,
        duration: cached.duration,
      };
    }

    // Calculate route
    let result: RouteResult;

    if (this.isWorkerSupported && this.worker) {
      result = await this.calculateViaWorker(origin, destination);
    } else {
      result = await this.calculateOnMainThread(origin, destination);
    }

    // Cache the result
    routeCacheService.setRoute({
      origin,
      destination,
      ...result,
    });

    return result;
  }

  private calculateViaWorker(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteResult> {
    return new Promise((resolve, reject) => {
      const id = `route_${++this.requestId}`;
      
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        // Fallback to main thread on timeout
        this.calculateOnMainThread(origin, destination)
          .then(resolve)
          .catch(reject);
      }, 15000);

      this.pendingRequests.set(id, (result, error) => {
        clearTimeout(timeout);
        if (result) {
          resolve(result);
        } else {
          reject(new Error(error || 'Route calculation failed'));
        }
      });

      this.worker!.postMessage({
        type: 'CALCULATE_ROUTE',
        id,
        origin,
        destination,
      });
    });
  }

  private async calculateOnMainThread(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<RouteResult> {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const geometry = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    return {
      geometry,
      distance: route.distance,
      duration: route.duration,
    };
  }

  /**
   * Terminate worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

export const routeWorkerService = new RouteWorkerService();
export default routeWorkerService;
