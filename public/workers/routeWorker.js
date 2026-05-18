/**
 * Route Calculation Web Worker
 * Offloads OSRM API calls to prevent UI blocking
 */

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Calculate route using OSRM
 */
async function calculateRoute(origin, destination) {
  const url = `${OSRM_BASE_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    
    // Transform coordinates from [lng, lat] to [lat, lng] for Leaflet
    const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    // Simplify geometry if too many points (Douglas-Peucker simplification)
    const simplifiedGeometry = simplifyGeometry(geometry, 0.00005);

    return {
      success: true,
      route: {
        geometry: simplifiedGeometry,
        distance: route.distance,
        duration: route.duration,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to calculate route',
    };
  }
}

/**
 * Douglas-Peucker line simplification algorithm
 * Reduces number of points while preserving shape
 */
function simplifyGeometry(points, tolerance) {
  if (points.length <= 2) return points;

  // Find the point with the maximum distance
  let maxDist = 0;
  let maxIndex = 0;

  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyGeometry(points.slice(0, maxIndex + 1), tolerance);
    const right = simplifyGeometry(points.slice(maxIndex), tolerance);
    return left.slice(0, -1).concat(right);
  } else {
    return [start, end];
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const [y, x] = point;
  const [y1, x1] = lineStart;
  const [y2, x2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
}

// Handle messages from main thread
self.onmessage = async function (e) {
  const { type, id, origin, destination } = e.data;

  if (type === 'CALCULATE_ROUTE') {
    const result = await calculateRoute(origin, destination);
    self.postMessage({ id, ...result });
  }
};
