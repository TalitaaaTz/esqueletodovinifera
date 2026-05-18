/**
 * Route Cache Service - Caches routes and map data for performance
 */

export interface CachedRoute {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  geometry: [number, number][];
  distance: number;
  duration: number;
  timestamp: number;
}

const CACHE_KEY = 'vinifera_route_cache';
const SEARCH_CACHE_KEY = 'vinifera_search_cache';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHED_ROUTES = 10;
const MAX_CACHED_SEARCHES = 50;

class RouteCacheService {
  private memoryCache: Map<string, CachedRoute> = new Map();
  private searchCache: Map<string, any[]> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Generate cache key from origin and destination
   */
  private generateKey(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): string {
    // Round to 4 decimal places (~11m accuracy) for cache key
    const oLat = origin.lat.toFixed(4);
    const oLng = origin.lng.toFixed(4);
    const dLat = destination.lat.toFixed(4);
    const dLng = destination.lng.toFixed(4);
    return `${oLat},${oLng}-${dLat},${dLng}`;
  }

  /**
   * Get cached route if available and not expired
   */
  getRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): CachedRoute | null {
    const key = this.generateKey(origin, destination);
    const cached = this.memoryCache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_EXPIRY_MS) {
      this.memoryCache.delete(key);
      this.saveToStorage();
      return null;
    }

    return cached;
  }

  /**
   * Cache a route
   */
  setRoute(route: Omit<CachedRoute, 'timestamp'>): void {
    const key = this.generateKey(route.origin, route.destination);
    
    const cachedRoute: CachedRoute = {
      ...route,
      timestamp: Date.now(),
    };

    this.memoryCache.set(key, cachedRoute);

    // Limit cache size
    if (this.memoryCache.size > MAX_CACHED_ROUTES) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.saveToStorage();
  }

  /**
   * Get last used route
   */
  getLastRoute(): CachedRoute | null {
    let latest: CachedRoute | null = null;
    
    this.memoryCache.forEach((route) => {
      if (!latest || route.timestamp > latest.timestamp) {
        latest = route;
      }
    });

    return latest;
  }

  /**
   * Cache search results
   */
  setSearchResults(query: string, results: any[]): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.searchCache.set(normalizedQuery, results);

    // Limit cache size
    if (this.searchCache.size > MAX_CACHED_SEARCHES) {
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey) {
        this.searchCache.delete(oldestKey);
      }
    }
  }

  /**
   * Get cached search results
   */
  getSearchResults(query: string): any[] | null {
    const normalizedQuery = query.toLowerCase().trim();
    return this.searchCache.get(normalizedQuery) || null;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear();
    this.searchCache.clear();
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(SEARCH_CACHE_KEY);
    } catch (e) {
      console.warn('Failed to clear cache from storage:', e);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const routes: CachedRoute[] = JSON.parse(stored);
        routes.forEach((route) => {
          const key = this.generateKey(route.origin, route.destination);
          // Only load if not expired
          if (Date.now() - route.timestamp < CACHE_EXPIRY_MS) {
            this.memoryCache.set(key, route);
          }
        });
      }
    } catch (e) {
      console.warn('Failed to load route cache:', e);
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    try {
      const routes = Array.from(this.memoryCache.values());
      localStorage.setItem(CACHE_KEY, JSON.stringify(routes));
    } catch (e) {
      console.warn('Failed to save route cache:', e);
    }
  }
}

export const routeCacheService = new RouteCacheService();
export default routeCacheService;
