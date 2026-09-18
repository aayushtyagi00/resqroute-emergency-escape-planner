import { OfflineStorageState, OfflineTileSector } from '../types';

const STORAGE_KEY = 'resqroute_offline_tiles_v1';
const CACHE_NAME = 'resqroute-map-tiles-v1';

export const DEFAULT_OFFLINE_SECTORS: OfflineTileSector[] = [
  {
    id: 'sector-topo-ridge',
    name: 'High Ridge & Mountain Pass Contours',
    description: 'Topographic elevation slices (+320m), gradient meshes, rockfall slopes',
    tileCount: 32,
    sizeMb: 4.2,
    status: 'cached',
  },
  {
    id: 'sector-river-drainage',
    name: 'River Basin & Flood Drain Meshes',
    description: 'Ashwani Khad watercourse, Bridge 1 & Bridge 2 inundation contours',
    tileCount: 28,
    sizeMb: 3.6,
    status: 'cached',
  },
  {
    id: 'sector-evac-highways',
    name: 'NH-05 & Primary Arterial Pavement',
    description: 'Highway corridors, turnouts, paved bypass paths, and road shoulders',
    tileCount: 36,
    sizeMb: 4.8,
    status: 'cached',
  },
  {
    id: 'sector-shelter-hospitals',
    name: 'Designated Shelters & Medical Gates',
    description: '5 safe shelter zones, 3 trauma hospitals, helipad & emergency access',
    tileCount: 24,
    sizeMb: 3.2,
    status: 'cached',
  },
  {
    id: 'sector-iot-telemetry',
    name: 'IoT Sensor Network & Seismic Nodes',
    description: 'Real-time telemetry anchors, river depth gauges, tilt monitoring pins',
    tileCount: 24,
    sizeMb: 2.6,
    status: 'cached',
  },
];

export const INITIAL_OFFLINE_STORAGE: OfflineStorageState = {
  tilesDownloaded: true,
  downloadProgress: 100,
  isDownloading: false,
  downloadedAt: 'Cached Offline Pack (v2.4)',
  totalSizeMb: 18.4,
  totalTiles: 144,
  cacheVersion: 'v2.4-carto-tiles',
  sectors: DEFAULT_OFFLINE_SECTORS,
  isSimulatedOffline: false,
};

/**
 * Loads stored offline tile state from localStorage or falls back to default.
 */
export function getStoredOfflineState(): OfflineStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_OFFLINE_STORAGE,
        ...parsed,
        isDownloading: false,
      };
    }
  } catch {
    // Fallback to initial
  }
  return INITIAL_OFFLINE_STORAGE;
}

/**
 * Saves offline tile state to localStorage.
 */
export function saveStoredOfflineState(state: OfflineStorageState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tilesDownloaded: state.tilesDownloaded,
        downloadProgress: state.downloadProgress,
        downloadedAt: state.downloadedAt,
        totalSizeMb: state.totalSizeMb,
        totalTiles: state.totalTiles,
        cacheVersion: state.cacheVersion,
        sectors: state.sectors,
        isSimulatedOffline: state.isSimulatedOffline,
      })
    );
  } catch {
    // Storage quota or private browsing fallback
  }
}

/**
 * Simulates progressive download of vector map tiles into browser Cache Storage
 */
export async function downloadOfflineMapTiles(
  onProgress: (progress: number, currentSector: string) => void
): Promise<OfflineStorageState> {
  const sectors: OfflineTileSector[] = DEFAULT_OFFLINE_SECTORS.map((s) => ({
    ...s,
    status: 'pending',
  }));

  // Populate browser cache if window.caches is available
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      // Store tile manifest
      const manifest = {
        version: 'v2.4-carto-tiles',
        timestamp: new Date().toISOString(),
        sectors: DEFAULT_OFFLINE_SECTORS,
        bounds: { north: 31.25, south: 28.45, west: 77.05, east: 77.35 },
      };
      await cache.put(
        new Request('/offline-tiles/manifest.json'),
        new Response(JSON.stringify(manifest), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    } catch {
      // Non-blocking in sandboxed iframes
    }
  }

  // Progressive simulated download with realistic feedback steps
  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    sector.status = 'downloading';
    const baseProgress = Math.round((i / sectors.length) * 100);
    onProgress(baseProgress, `Downloading ${sector.name}...`);
    await new Promise((r) => setTimeout(r, 160));

    onProgress(baseProgress + 10, `Compiling vector contours for ${sector.name}...`);
    await new Promise((r) => setTimeout(r, 160));

    sector.status = 'cached';
  }

  onProgress(100, 'All 144 vector tiles successfully cached to offline storage');
  await new Promise((r) => setTimeout(r, 100));

  const completedState: OfflineStorageState = {
    tilesDownloaded: true,
    downloadProgress: 100,
    isDownloading: false,
    downloadedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    totalSizeMb: 18.4,
    totalTiles: 144,
    cacheVersion: 'v2.4-carto-tiles',
    sectors: sectors.map((s) => ({ ...s, status: 'cached' })),
    isSimulatedOffline: false,
  };

  saveStoredOfflineState(completedState);
  return completedState;
}

/**
 * Clears the offline tile cache from browser cache and localStorage
 */
export async function clearOfflineMapTiles(): Promise<OfflineStorageState> {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      // Silent catch
    }
  }

  const clearedState: OfflineStorageState = {
    tilesDownloaded: false,
    downloadProgress: 0,
    isDownloading: false,
    downloadedAt: undefined,
    totalSizeMb: 0,
    totalTiles: 0,
    cacheVersion: 'v2.4-carto-tiles',
    sectors: DEFAULT_OFFLINE_SECTORS.map((s) => ({ ...s, status: 'pending' })),
    isSimulatedOffline: false,
  };

  saveStoredOfflineState(clearedState);
  return clearedState;
}

/**
 * Checks if the application is currently running offline (either real network loss or user simulation)
 */
export function isNavigationOffline(isSimulatedOffline = false): boolean {
  if (isSimulatedOffline) return true;
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return !navigator.onLine;
  }
  return false;
}
