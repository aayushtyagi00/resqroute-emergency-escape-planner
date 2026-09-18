// Stadia Maps API Integration & Secure Backend Tile Provider for ResQRoute

export type StadiaMapStyle = 'alidade_smooth_dark' | 'outdoors' | 'alidade_smooth' | 'satellite';

export interface StadiaStyleOption {
  id: StadiaMapStyle;
  label: string;
  description: string;
  badge: string;
}

export const STADIA_STYLE_OPTIONS: StadiaStyleOption[] = [
  {
    id: 'alidade_smooth_dark',
    label: 'Stadia Alidade Dark',
    description: 'Tactical high-contrast night styling optimized for emergency crisis operations',
    badge: 'Tactical Dark',
  },
  {
    id: 'outdoors',
    label: 'Stadia Outdoors / Terrain',
    description: 'Topographical terrain lines, elevation contours, rivers, and watershed gradients',
    badge: 'Topography',
  },
  {
    id: 'alidade_smooth',
    label: 'Stadia Alidade Light',
    description: 'Clean high-visibility daytime road network and municipal boundaries',
    badge: 'Daylight',
  },
  {
    id: 'satellite',
    label: 'Stadia Satellite Hybrid',
    description: 'High-resolution aerial satellite imagery with overlay street vector networks',
    badge: 'Satellite',
  },
];

// The Stadia Maps API key is stored strictly on the backend server (.env)
// and never exposed to the client or browser network requests.
export function isBackendTileProxyActive(): boolean {
  return true;
}

// Deprecated client key helpers maintained for backwards compatibility
export function getStadiaApiKey(): string {
  return '';
}

export function setStadiaApiKey(_key: string): void {
  // Key management handled securely by server environment
}

export function clearStadiaApiKey(): void {
  // Key management handled securely by server environment
}

export function getTileLayerConfig(style: StadiaMapStyle, _apiKey?: string) {
  // All tiles route through our secure backend proxy (/api/tiles/:style/:z/:x/:file)
  // which attaches the private server-side key upstream without leaking it to the client.
  if (style === 'satellite') {
    return {
      url: '/api/tiles/alidade_satellite/{z}/{x}/{y}.jpg',
      attribution:
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; CNES, Earthstar Geographics',
      maxZoom: 20,
    };
  }

  if (style === 'outdoors') {
    return {
      url: '/api/tiles/outdoors/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 20,
    };
  }

  if (style === 'alidade_smooth') {
    return {
      url: '/api/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
      attribution:
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 20,
    };
  }

  // Default: alidade_smooth_dark
  return {
    url: '/api/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://openstreetmap.org">OSM</a>',
    maxZoom: 20,
  };
}
