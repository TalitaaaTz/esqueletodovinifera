/**
 * GPS Service - Handles geolocation with throttled updates
 * Optimized for performance similar to Waze/Google Maps
 */

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GPSServiceOptions {
  enableHighAccuracy?: boolean;
  throttleMs?: number;
  maxAge?: number;
  timeout?: number;
}

type PositionCallback = (position: GeoPosition) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;

class GPSService {
  private watchId: number | null = null;
  private lastPosition: GeoPosition | null = null;
  private lastUpdateTime: number = 0;
  private throttleMs: number = 1000; // Default 1 second throttle
  private subscribers: Set<PositionCallback> = new Set();
  private errorSubscribers: Set<ErrorCallback> = new Set();
  private pendingUpdate: GeoPosition | null = null;
  private throttleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Singleton pattern - reuse existing instance
    if (typeof window !== 'undefined') {
      const existing = (window as any).__gpsService;
      if (existing) {
        return existing;
      }
      (window as any).__gpsService = this;
    }
  }

  /**
   * Start watching GPS position with throttled updates
   */
  startWatching(options: GPSServiceOptions = {}): void {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    if (this.watchId !== null) {
      // Already watching
      return;
    }

    this.throttleMs = options.throttleMs ?? 1000;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleError(error),
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        maximumAge: options.maxAge ?? 5000,
        timeout: options.timeout ?? 10000,
      }
    );
  }

  /**
   * Stop watching GPS position
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
  }

  /**
   * Subscribe to position updates
   */
  subscribe(callback: PositionCallback): () => void {
    this.subscribers.add(callback);

    // Immediately send last known position if available
    if (this.lastPosition) {
      callback(this.lastPosition);
    }

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Subscribe to errors
   */
  subscribeError(callback: ErrorCallback): () => void {
    this.errorSubscribers.add(callback);
    return () => {
      this.errorSubscribers.delete(callback);
    };
  }

  /**
   * Get last known position (from cache)
   */
  getLastPosition(): GeoPosition | null {
    return this.lastPosition;
  }

  /**
   * Request single position update
   */
  async getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoPos = this.convertPosition(position);
          this.lastPosition = geoPos;
          resolve(geoPos);
        },
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  private handlePosition(position: GeolocationPosition): void {
    const geoPos = this.convertPosition(position);
    const now = Date.now();

    // Always update last position for caching
    this.lastPosition = geoPos;

    // Throttle updates to subscribers
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate >= this.throttleMs) {
      // Enough time has passed, send update immediately
      this.lastUpdateTime = now;
      this.notifySubscribers(geoPos);
    } else {
      // Store pending update and schedule delayed notification
      this.pendingUpdate = geoPos;

      if (!this.throttleTimer) {
        const delay = this.throttleMs - timeSinceLastUpdate;
        this.throttleTimer = setTimeout(() => {
          this.throttleTimer = null;
          if (this.pendingUpdate) {
            this.lastUpdateTime = Date.now();
            this.notifySubscribers(this.pendingUpdate);
            this.pendingUpdate = null;
          }
        }, delay);
      }
    }
  }

  private handleError(error: GeolocationPositionError): void {
    this.errorSubscribers.forEach((callback) => {
      try {
        callback(error);
      } catch (e) {
        console.error('Error in GPS error subscriber:', e);
      }
    });
  }

  private notifySubscribers(position: GeoPosition): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(position);
      } catch (e) {
        console.error('Error in GPS subscriber:', e);
      }
    });
  }

  private convertPosition(position: GeolocationPosition): GeoPosition {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      timestamp: position.timestamp,
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  static calculateDistance(pos1: GeoPosition, pos2: GeoPosition): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Export singleton instance
export const gpsService = new GPSService();
export default gpsService;
