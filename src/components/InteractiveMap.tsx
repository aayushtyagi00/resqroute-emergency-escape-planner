import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Layers,
  MapPin,
  Shield,
  Home,
  PlusSquare,
  AlertTriangle,
  Radio,
  Navigation,
  Compass,
  Crosshair,
  Route,
  Flag,
  CheckCircle2,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { DangerZone, Hospital, IoTSensor, OfflineStorageState, RouteOption, Shelter } from '../types';
import { USER_ORIGIN } from '../data/mockData';
import {
  getTileLayerConfig,
  StadiaMapStyle,
  STADIA_STYLE_OPTIONS,
} from '../utils/stadiaMaps';
import { StadiaKeyModal } from './StadiaKeyModal';

export interface MapFocusTarget {
  type: 'shelter' | 'hospital' | 'sensor' | 'route' | 'origin' | 'dangerZone';
  id: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  title?: string;
  timestamp?: number;
}

interface InteractiveMapProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  dangerZones: DangerZone[];
  shelters: Shelter[];
  selectedShelterId: string;
  onSelectShelter: (id: string) => void;
  hospitals: Hospital[];
  sensors: IoTSensor[];
  isEmergencyMode: boolean;
  roadABlocked: boolean;
  heavyRainSurge: boolean;
  userOrigin?: {
    location: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    locationSource?: string;
  };
  onOpenSetup?: () => void;
  offlineTilesEnabled?: boolean;
  offlineStorage?: OfflineStorageState;
  isOffline?: boolean;
  showItinerary?: boolean;
  mapFocusTarget?: MapFocusTarget | null;
  onUpdateOriginCoords?: (lat: number, lng: number) => void;
  onNavigateTab?: (tab: 'map' | 'hud' | 'routes' | 'whatif' | 'shelters' | 'checklist' | 'ai' | 'sensors') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  dangerZones,
  shelters,
  selectedShelterId,
  onSelectShelter,
  hospitals,
  sensors,
  isEmergencyMode,
  roadABlocked,
  heavyRainSurge,
  userOrigin,
  onOpenSetup,
  showItinerary = true,
  mapFocusTarget,
  onUpdateOriginCoords,
  onNavigateTab,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const dangerLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  // Stadia Maps cartography state
  const [mapStyle, setMapStyle] = useState<StadiaMapStyle>(() =>
    isEmergencyMode ? 'alidade_smooth_dark' : 'outdoors'
  );
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  // Layer toggles (Sensors enabled by default for live emergency awareness)
  const [showDangerZones, setShowDangerZones] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showHospitals, setShowHospitals] = useState<boolean>(true);
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showAlternativeRoutes, setShowAlternativeRoutes] = useState<boolean>(true);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [showWaypointsList, setShowWaypointsList] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isRelocateMode, setIsRelocateMode] = useState<boolean>(false);

  // Active entities
  const activeRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) || routes[0],
    [routes, selectedRouteId]
  );
  const activeShelter = useMemo(
    () => shelters.find((s) => s.id === selectedShelterId) || shelters[0],
    [shelters, selectedShelterId]
  );

  // Effective origin center
  const originLat = userOrigin?.latitude ?? USER_ORIGIN.lat ?? 28.6139;
  const originLng = userOrigin?.longitude ?? USER_ORIGIN.lng ?? 77.2090;

  // Always display the complete 5 strategic steps for the UI itinerary
  const mainWaypoints = useMemo(() => {
    if (!activeRoute || !activeRoute.pathPoints || activeRoute.pathPoints.length === 0) return [];
    const pts = activeRoute.pathPoints;
    const destLat = activeShelter?.coordinates?.lat ?? 28.6360;
    const destLng = activeShelter?.coordinates?.lng ?? 77.2180;
    const targetCount = 5;

    if (pts.length <= targetCount) {
      return pts.map((pt, i) => {
        const isStart = i === 0;
        const isEnd = i === pts.length - 1;
        return {
          ...pt,
          lat: isStart ? originLat : isEnd ? destLat : pt.lat ?? originLat,
          lng: isStart ? originLng : isEnd ? destLng : pt.lng ?? originLng,
          stepNumber: i + 1,
          isStart,
          isEnd,
          tag: isStart ? 'START' : isEnd ? 'SAFE HAVEN' : 'CORRIDOR',
          title: isStart
            ? (userOrigin?.location || 'Origin Point')
            : isEnd
            ? activeShelter.name
            : (pt.name && !pt.name.startsWith('Waypoint') ? pt.name : `Corridor Checkpoint ${i}`),
          desc: isStart
            ? 'GPS Fix active • Departure'
            : isEnd
            ? `${activeShelter.distanceKm} km arrival • Space Reserved`
            : 'Follow safe corridor chevrons',
        };
      });
    }

    // Distribute 5 sample indices evenly across the full path (0%, 25%, 50%, 75%, 100%)
    const sampledIndices = [
      0,
      Math.round((pts.length - 1) * 0.25),
      Math.round((pts.length - 1) * 0.50),
      Math.round((pts.length - 1) * 0.75),
      pts.length - 1,
    ];

    const templates = [
      { tag: 'START', title: userOrigin?.location || 'Origin Point', desc: 'GPS Fix active • Departure' },
      { tag: 'JUNCTION', title: 'Primary Arterial Merge', desc: 'Follow illuminated corridor chevrons' },
      { tag: 'HIGH GROUND', title: 'Elevated Ridge Corridor', desc: '+18m MSL elevation safety buffer' },
      { tag: 'APPROACH', title: 'Relief Sector Ingress', desc: 'Clearance verified • Emergency transit priority' },
      { tag: 'SAFE HAVEN', title: activeShelter.name, desc: `${activeShelter.distanceKm} km arrival • Space Reserved` },
    ];

    return sampledIndices.map((idx, stepIdx) => {
      const pt = pts[idx];
      const isStart = stepIdx === 0;
      const isEnd = stepIdx === sampledIndices.length - 1;
      const tpl = templates[stepIdx];

      const resolvedLat = isStart ? originLat : isEnd ? destLat : pt.lat ?? originLat;
      const resolvedLng = isStart ? originLng : isEnd ? destLng : pt.lng ?? originLng;

      return {
        ...pt,
        lat: resolvedLat,
        lng: resolvedLng,
        stepNumber: stepIdx + 1,
        isStart,
        isEnd,
        tag: tpl.tag,
        title: isStart ? (userOrigin?.location || 'Origin Point') : isEnd ? activeShelter.name : tpl.title,
        desc: isStart ? 'GPS Fix active • Departure' : isEnd ? `${activeShelter.distanceKm} km arrival • Space Reserved` : tpl.desc,
      };
    });
  }, [activeRoute, userOrigin, activeShelter, originLat, originLng]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [originLat, originLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: true,
      });

      // Add custom positioned zoom controls
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Create layer groups
      dangerLayerRef.current = L.layerGroup().addTo(map);
      routesLayerRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    // Initialize or update Tile Layer via secure backend proxy
    const { url, attribution, maxZoom } = getTileLayerConfig(mapStyle);
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const tileLayer = L.tileLayer(url, { attribution, maxZoom }).addTo(mapInstanceRef.current);
    tileLayerRef.current = tileLayer;

    return () => {
      // Cleanup on full unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle map click for origin relocation
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!isRelocateMode) return;
      onUpdateOriginCoords?.(e.latlng.lat, e.latlng.lng);
      setIsRelocateMode(false);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isRelocateMode, onUpdateOriginCoords]);

  // Handle external focus target requests (from Shelters, Hospitals, Sensors, Routes, AI)
  useEffect(() => {
    if (!mapFocusTarget || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (mapFocusTarget.type === 'route') {
      const targetRoute = routes.find((r) => r.id === mapFocusTarget.id);
      if (targetRoute) {
        const destLat = activeShelter?.coordinates?.lat ?? 28.6360;
        const destLng = activeShelter?.coordinates?.lng ?? 77.2180;
        const latLngs: [number, number][] = targetRoute.pathPoints.map((pt, idx) => {
          if (idx === 0) return [originLat, originLng];
          if (idx === targetRoute.pathPoints.length - 1) return [destLat, destLng];
          return [pt.lat ?? originLat + 0.01, pt.lng ?? originLng + 0.01];
        });
        if (latLngs.length > 0) {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], animate: true });
        }
      }
    } else if (mapFocusTarget.lat !== undefined && mapFocusTarget.lng !== undefined) {
      map.flyTo([mapFocusTarget.lat, mapFocusTarget.lng], mapFocusTarget.zoom ?? 16, {
        animate: true,
        duration: 0.9,
      });

      // Enable relevant layers if currently hidden
      if (mapFocusTarget.type === 'sensor') setShowSensors(true);
      if (mapFocusTarget.type === 'shelter') setShowShelters(true);
      if (mapFocusTarget.type === 'hospital') setShowHospitals(true);
      if (mapFocusTarget.type === 'dangerZone') setShowDangerZones(true);

      // Open marker popup automatically after arrival
      setTimeout(() => {
        const marker = markersMapRef.current.get(mapFocusTarget.id);
        if (marker) {
          marker.openPopup();
        }
      }, 500);
    }
  }, [mapFocusTarget, routes, originLat, originLng, activeShelter]);

  // Listen for custom dispatch events
  useEffect(() => {
    const handleCustomShelterSelect = (e: any) => {
      if (e.detail) {
        onSelectShelter(e.detail);
      }
    };
    const handleTabNav = (e: any) => {
      if (e.detail && onNavigateTab) {
        onNavigateTab(e.detail);
      }
    };

    document.addEventListener('resqroute-select-shelter', handleCustomShelterSelect);
    document.addEventListener('resqroute-navigate-tab', handleTabNav);
    return () => {
      document.removeEventListener('resqroute-select-shelter', handleCustomShelterSelect);
      document.removeEventListener('resqroute-navigate-tab', handleTabNav);
    };
  }, [onSelectShelter, onNavigateTab]);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { url, attribution, maxZoom } = getTileLayerConfig(mapStyle);
    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }
    const tileLayer = L.tileLayer(url, { attribution, maxZoom }).addTo(mapInstanceRef.current);
    tileLayerRef.current = tileLayer;
  }, [mapStyle]);

  // Keep theme synced with emergency mode
  useEffect(() => {
    if (isEmergencyMode) {
      setMapStyle('alidade_smooth_dark');
    }
  }, [isEmergencyMode]);

  // Render Danger Zones on Leaflet Map
  useEffect(() => {
    if (!dangerLayerRef.current) return;
    dangerLayerRef.current.clearLayers();

    if (!showDangerZones) return;

    dangerZones.forEach((dz) => {
      if (!dz) return;
      const lat = dz.center?.lat ?? (dz as any).coordinates?.lat ?? (dz.center?.y !== undefined ? originLat + (dz.center.y - 260) * 0.00018 : originLat);
      const lng = dz.center?.lng ?? (dz as any).coordinates?.lng ?? (dz.center?.x !== undefined ? originLng + (dz.center.x - 100) * 0.00018 : originLng);
      if (isNaN(lat) || isNaN(lng)) return;
      const radiusMeters = (dz.radiusKm || 0.45) * 1000;

      const isCritical = dz.severity === 'critical';
      const color = isCritical ? '#ef4444' : '#f59e0b';

      const circle = L.circle([lat, lng], {
        radius: radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: isCritical ? 0.32 : 0.20,
        weight: 2,
        dashArray: isCritical ? '6, 6' : undefined,
      });

      circle.bindPopup(`
        <div class="p-2 text-xs text-white">
          <div class="font-bold text-red-400 uppercase text-[11px] mb-1 flex items-center gap-1">
            ⚠ ${dz.name} (${(dz.severity || 'high').toUpperCase()})
          </div>
          <p class="text-neutral-300 text-[11px] mb-1.5">${dz.description || ''}</p>
          <div class="text-[10px] text-neutral-400 font-mono mb-2">
            Surge Expansion: <strong class="text-amber-300">${dz.expansionRate || '+10 cm/h'}</strong>
          </div>
          <button onclick="document.dispatchEvent(new CustomEvent('resqroute-navigate-tab', { detail: 'whatif' }))" class="w-full py-1 rounded bg-red-600/90 hover:bg-red-500 text-white font-bold text-[10px] text-center cursor-pointer">
            Run What-If Hazard Simulation &rarr;
          </button>
        </div>
      `);

      dangerLayerRef.current?.addLayer(circle);
    });
  }, [dangerZones, showDangerZones, originLat, originLng]);

  // Render Routes (Polylines) on Leaflet Map
  useEffect(() => {
    if (!routesLayerRef.current) return;
    routesLayerRef.current.clearLayers();

    // Destination shelter coordinates
    const destLat = activeShelter?.coordinates?.lat ?? 28.6360;
    const destLng = activeShelter?.coordinates?.lng ?? 77.2180;

    routes.forEach((route) => {
      if (!route || !route.pathPoints || route.pathPoints.length === 0) return;
      const isSelected = route.id === selectedRouteId;
      const isBlocked = route.status === 'blocked' || (route.id === 'route-a' && roadABlocked);

      if (!isSelected && !showAlternativeRoutes) return;

      // Extract real GPS lat/lng points
      const latLngs: [number, number][] = route.pathPoints.map((pt, idx) => {
        if (idx === 0) return [originLat, originLng];
        if (idx === route.pathPoints.length - 1) return [destLat, destLng];
        const lat = pt.lat ?? (pt.y !== undefined ? originLat + (pt.y - 260) * 0.00018 : originLat);
        const lng = pt.lng ?? (pt.x !== undefined ? originLng + (pt.x - 100) * 0.00018 : originLng);
        return [isNaN(lat) ? originLat : lat, isNaN(lng) ? originLng : lng];
      });

      const routeColor = isBlocked
        ? '#ef4444'
        : isSelected
        ? '#10b981'
        : route.tag === 'accessible'
        ? '#06b6d4'
        : '#94a3b8';

      // Outer glow line for selected route
      if (isSelected && !isBlocked) {
        const glowLine = L.polyline(latLngs, {
          color: '#10b981',
          weight: 10,
          opacity: 0.35,
          lineCap: 'round',
        });
        routesLayerRef.current?.addLayer(glowLine);
      }

      const line = L.polyline(latLngs, {
        color: routeColor,
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 1 : 0.65,
        dashArray: isBlocked ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      });

      line.on('click', () => {
        onSelectRoute(route.id);
      });

      line.bindTooltip(`${route.name} (${route.safetyScore}/100 pts)`, {
        sticky: true,
        className: 'tactical-route-tooltip',
      });

      routesLayerRef.current?.addLayer(line);
    });

    // If Road A is blocked, place a visible Road Closure barrier marker on the bridge
    if (roadABlocked) {
      const blockedIcon = L.divIcon({
        className: 'roadblock-marker-hud',
        html: `
          <div class="px-2 py-0.5 rounded-lg bg-red-600 border-2 border-white text-white font-black text-[9px] shadow-lg flex items-center gap-1 animate-pulse">
            ⛔ ROAD CLOSED
          </div>
        `,
        iconSize: [85, 24],
        iconAnchor: [42, 12],
      });
      const roadblockMarker = L.marker([28.6220, 77.2190], { icon: blockedIcon });
      roadblockMarker.bindPopup(`
        <div class="p-2 text-xs text-white">
          <div class="font-bold text-red-400 text-xs mb-1">⛔ Road A Blocked</div>
          <p class="text-[11px] text-neutral-300 mb-1.5">Bridge 2 is submerged by rising water. Rerouted to Route B Ridge Bypass.</p>
          <button onclick="document.dispatchEvent(new CustomEvent('resqroute-navigate-tab', { detail: 'whatif' }))" class="w-full py-1 rounded bg-neutral-800 text-neutral-200 text-[10px] text-center font-bold">
            Simulate Road Opening &rarr;
          </button>
        </div>
      `);
      routesLayerRef.current?.addLayer(roadblockMarker);
    }
  }, [routes, selectedRouteId, activeShelter, roadABlocked, showAlternativeRoutes, originLat, originLng]);

  // Render Markers (Origin, Shelters, Hospitals, Sensors)
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    // 1. User Origin Marker (Radar Pulse Beacon - DRAGGABLE FOR LOCATION SYNC)
    const originIcon = L.divIcon({
      className: 'origin-marker-tactical',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing">
          <span class="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping"></span>
          <span class="relative w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-black"></span>
          </span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const originMarker = L.marker([originLat, originLng], {
      icon: originIcon,
      draggable: true,
    });

    originMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      onUpdateOriginCoords?.(pos.lat, pos.lng);
    });

    originMarker.bindPopup(`
      <div class="p-2 text-xs text-white min-w-[200px]">
        <div class="font-bold text-emerald-400 text-xs flex items-center gap-1.5 mb-1">
          📍 ${userOrigin?.location || 'Origin Point'}
        </div>
        <div class="text-[10px] text-neutral-300 font-mono mb-2">
          ${originLat.toFixed(4)}°N, ${originLng.toFixed(4)}°E (Fix ±${userOrigin?.accuracy || 12}m)
        </div>
        <p class="text-[11px] text-neutral-400 mb-2 leading-tight">
          Drag this beacon or click "Relocate Start" to re-anchor your evacuation origin anywhere on the map.
        </p>
      </div>
    `);
    markersLayerRef.current.addLayer(originMarker);
    markersMapRef.current.set('user-origin', originMarker);

    // 2. Shelters Markers
    if (showShelters) {
      shelters.forEach((shelter) => {
        if (!shelter) return;
        const lat = shelter.coordinates?.lat ?? (shelter.coordinates?.y !== undefined ? originLat + (shelter.coordinates.y - 260) * 0.00018 : originLat);
        const lng = shelter.coordinates?.lng ?? (shelter.coordinates?.x !== undefined ? originLng + (shelter.coordinates.x - 100) * 0.00018 : originLng);
        if (isNaN(lat) || isNaN(lng)) return;

        const isSelected = shelter.id === selectedShelterId;
        const isFull = shelter.status === 'Full';
        const totalCap = shelter.capacityTotal || 100;
        const occCap = shelter.capacityOccupied || 0;
        const occupancyPct = Math.round((occCap / totalCap) * 100);

        const badgeColor = isFull ? 'bg-red-600' : isSelected ? 'bg-emerald-500' : 'bg-purple-600';

        const shelterIcon = L.divIcon({
          className: 'shelter-marker-tactical',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="w-8 h-8 rounded-2xl ${badgeColor} text-white flex items-center justify-center shadow-lg border-2 border-white/80 transition-transform group-hover:scale-110">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
              </div>
              <div class="mt-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-bold text-white border border-white/20 whitespace-nowrap shadow">
                ${occupancyPct}% FULL
              </div>
            </div>
          `,
          iconSize: [40, 48],
          iconAnchor: [20, 24],
        });

        const marker = L.marker([lat, lng], { icon: shelterIcon });
        marker.on('click', () => {
          onSelectShelter(shelter.id);
        });

        marker.bindPopup(`
          <div class="p-2 text-xs text-white min-w-[210px]">
            <div class="font-bold text-sm text-white mb-0.5">${shelter.name}</div>
            <div class="text-[10px] text-neutral-400 mb-2 font-mono">
              Distance: ${shelter.distanceKm} km • ETA: ${shelter.timeMinutes} mins
            </div>
            <div class="text-[11px] mb-2 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 flex justify-between">
              <span>Cots Available:</span>
              <strong class="text-emerald-400 font-mono">${Math.max(0, totalCap - occCap)} beds</strong>
            </div>
            <button onclick="document.dispatchEvent(new CustomEvent('resqroute-select-shelter', { detail: '${shelter.id}' }))" class="w-full py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] text-center cursor-pointer mb-1.5">
              ${isSelected ? '✓ Selected Safe Haven' : 'Set as Safe Destination & Reroute'}
            </button>
            <button onclick="document.dispatchEvent(new CustomEvent('resqroute-navigate-tab', { detail: 'shelters' }))" class="w-full py-1 rounded bg-neutral-800 text-neutral-300 text-[10px] text-center font-semibold cursor-pointer">
              View All Facilities & Amenities &rarr;
            </button>
          </div>
        `);

        markersLayerRef.current?.addLayer(marker);
        markersMapRef.current.set(shelter.id, marker);
      });
    }

    // 3. Hospitals Markers
    if (showHospitals) {
      hospitals.forEach((hosp) => {
        if (!hosp) return;
        const lat = hosp.coordinates?.lat ?? (hosp.coordinates?.y !== undefined ? originLat + (hosp.coordinates.y - 260) * 0.00018 : originLat);
        const lng = hosp.coordinates?.lng ?? (hosp.coordinates?.x !== undefined ? originLng + (hosp.coordinates.x - 100) * 0.00018 : originLng);
        if (isNaN(lat) || isNaN(lng)) return;

        const hospitalIcon = L.divIcon({
          className: 'hospital-marker-tactical',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="w-7 h-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-lg border-2 border-white/80">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <div class="mt-0.5 px-1.5 py-0.2 rounded-full bg-cyan-950/90 text-[8px] font-bold text-cyan-200 border border-cyan-500/40">
                ICU: ${hosp.icuBedsAvailable || 8}
              </div>
            </div>
          `,
          iconSize: [36, 44],
          iconAnchor: [18, 22],
        });

        const marker = L.marker([lat, lng], { icon: hospitalIcon });
        marker.bindPopup(`
          <div class="p-2 text-xs text-white min-w-[210px]">
            <div class="font-bold text-sm text-cyan-300 mb-0.5">${hosp.name}</div>
            <div class="text-[10px] text-neutral-400 font-mono mb-2">
              Trauma: <strong>${hosp.traumaLevel || 'Level 1 Trauma'}</strong> • ETA: ${hosp.timeMinutes} mins
            </div>
            <div class="text-[11px] p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 mb-2 flex justify-between">
              <span>ICU Capacity:</span>
              <strong class="text-emerald-400 font-mono">${hosp.icuBedsAvailable || 8} Open Beds</strong>
            </div>
            <button onclick="document.dispatchEvent(new CustomEvent('resqroute-navigate-tab', { detail: 'shelters' }))" class="w-full py-1.5 rounded-lg bg-cyan-600 text-white font-bold text-[11px] text-center cursor-pointer">
              View Hospital Triage Directory &rarr;
            </button>
          </div>
        `);

        markersLayerRef.current?.addLayer(marker);
        markersMapRef.current.set(hosp.id, marker);
      });
    }

    // 4. IoT Sensors Markers
    if (showSensors) {
      sensors.forEach((sensor) => {
        if (!sensor) return;
        const lat = sensor.coordinates?.lat ?? originLat + 0.005;
        const lng = sensor.coordinates?.lng ?? originLng + 0.005;
        if (isNaN(lat) || isNaN(lng)) return;

        const isCritical = sensor.status === 'critical';
        const isWarning = sensor.status === 'warning';
        const color = isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

        const sensorIcon = L.divIcon({
          className: 'sensor-marker-tactical',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="w-6 h-6 rounded-full ${color} border-2 border-white flex items-center justify-center shadow-md ${
                isCritical ? 'animate-bounce' : 'animate-pulse'
              }">
                <span class="w-2 h-2 rounded-full bg-white"></span>
              </div>
              <div class="mt-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-white/20 whitespace-nowrap">
                ${sensor.value} ${sensor.unit}
              </div>
            </div>
          `,
          iconSize: [28, 36],
          iconAnchor: [14, 18],
        });

        const marker = L.marker([lat, lng], { icon: sensorIcon });
        marker.bindPopup(`
          <div class="p-2 text-xs text-white min-w-[200px]">
            <div class="font-bold text-xs text-amber-400 mb-1 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full ${color}"></span>
              <span>${sensor.name}</span>
            </div>
            <div class="text-[11px] font-mono text-neutral-300 mb-1">
              Current Telemetry: <strong class="text-white">${sensor.value} ${sensor.unit}</strong> (Threshold: ${sensor.threshold})
            </div>
            <div class="text-[10px] text-neutral-400 font-mono mb-2">
              Status: <span class="uppercase font-bold text-amber-300">${sensor.status}</span> • Trend: ${sensor.trend}
            </div>
            <button onclick="document.dispatchEvent(new CustomEvent('resqroute-navigate-tab', { detail: 'sensors' }))" class="w-full py-1.5 rounded-lg bg-amber-600 text-white font-bold text-[11px] text-center cursor-pointer">
              Open Full Sensor Telemetry &rarr;
            </button>
          </div>
        `);

        markersLayerRef.current?.addLayer(marker);
        markersMapRef.current.set(sensor.id, marker);
      });
    }
  }, [originLat, originLng, shelters, selectedShelterId, hospitals, sensors, showShelters, showHospitals, showSensors, userOrigin, onSelectShelter, onUpdateOriginCoords]);

  // Recenter map on active route bounds
  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    const destLat = activeShelter?.coordinates.lat ?? 28.6360;
    const destLng = activeShelter?.coordinates.lng ?? 77.2180;
    const bounds = L.latLngBounds([
      [originLat, originLng],
      [destLat, destLng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  };

  // Live Browser Geolocation trigger
  const handleLocateMe = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        onUpdateOriginCoords?.(latitude, longitude);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true });
        }
      },
      () => {
        setIsLocating(false);
        alert('Could not acquire your current GPS coordinates. Ensure location permissions are allowed.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Relocate Mode Live Banner */}
      {isRelocateMode && (
        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-150">
          <span className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 animate-spin text-amber-400" />
            <span>Click anywhere on the map to place your evacuation start location. All routes, distances, and ETAs will recalibrate.</span>
          </span>
          <button
            onClick={() => setIsRelocateMode(false)}
            className="text-[11px] px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Top Tactical Map Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Left: Stadia Tile Switcher & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            title="Configure Map Style & Cartography Layers"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Map Layers</span>
          </button>

          {/* Quick Style Chips */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            {STADIA_STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMapStyle(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === opt.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {opt.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Quick Controls (Relocate, Recenter, GPS, Layers) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRelocateMode((v) => !v)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isRelocateMode
                ? 'bg-amber-500 text-black border-amber-400 font-black animate-pulse'
                : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Click to place starting location on map"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRelocateMode ? 'Click Map to Place' : 'Relocate Start'}</span>
          </button>

          <button
            onClick={handleFitRoute}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold transition cursor-pointer flex items-center gap-1.5"
            title="Recenter corridor view"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fit Route</span>
          </button>

          <button
            onClick={handleLocateMe}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold transition cursor-pointer flex items-center gap-1.5"
            title="Locate Current Position"
          >
            <Navigation className={`w-3.5 h-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Locate GPS'}</span>
          </button>

          {/* Layers Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsLayersOpen((v) => !v)}
              className="px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Overlays</span>
            </button>

            {isLayersOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 shadow-2xl z-50 space-y-2 text-xs text-white animate-in fade-in duration-150">
                <div className="font-bold text-[11px] uppercase tracking-wider text-neutral-400 pb-1 border-b border-neutral-800">
                  Tactical Map Overlays
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Danger Zones
                  </span>
                  <input
                    type="checkbox"
                    checked={showDangerZones}
                    onChange={(e) => setShowDangerZones(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-purple-400" /> Shelters
                  </span>
                  <input
                    type="checkbox"
                    checked={showShelters}
                    onChange={(e) => setShowShelters(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <PlusSquare className="w-3.5 h-3.5 text-cyan-400" /> Hospitals
                  </span>
                  <input
                    type="checkbox"
                    checked={showHospitals}
                    onChange={(e) => setShowHospitals(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" /> IoT Sensors
                  </span>
                  <input
                    type="checkbox"
                    checked={showSensors}
                    onChange={(e) => setShowSensors(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-neutral-400" /> Alternate Paths
                  </span>
                  <input
                    type="checkbox"
                    checked={showAlternativeRoutes}
                    onChange={(e) => setShowAlternativeRoutes(e.target.checked)}
                    className="accent-emerald-500"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real Map Canvas (Leaflet with Stadia Tiles) */}
      <div
        className={`relative w-full h-[520px] rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-[#0a0a0a] ${
          isRelocateMode ? 'cursor-crosshair ring-2 ring-amber-400' : ''
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top-Left Status Ribbon */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Stadia Real Maps Engine</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {mapStyle.replace('alidade_smooth_', '').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Waypoint Guidance Bar */}
      {showItinerary && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 text-white p-4 shadow-md">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wide flex items-center gap-2 flex-wrap">
                  <span>Active Route Itinerary: {activeRoute.name}</span>
                  <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {activeRoute.safetyScore}/100 SCORE
                  </span>
                  {activeRoute.status === 'blocked' && (
                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      BLOCKED
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-400 font-medium">
                  Total distance: <strong className="text-white font-mono">{activeRoute.distanceKm} km</strong> • Evacuation time: <strong className="text-white font-mono">{activeRoute.timeMinutes} mins</strong> • Safe Destination: <strong className="text-emerald-400">{activeShelter.name}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWaypointsList((v) => !v)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Route className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showWaypointsList ? 'Hide Waypoints' : 'Show Waypoints'}</span>
            </button>
          </div>

          {showWaypointsList && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3">
              {mainWaypoints.map((pt) => {
                return (
                  <div
                    key={pt.stepNumber}
                    onClick={() => {
                      if (mapInstanceRef.current && pt.lat && pt.lng) {
                        mapInstanceRef.current.flyTo([pt.lat, pt.lng], 15, { animate: true });
                      }
                    }}
                    className={`p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer hover:shadow-lg ${
                      pt.isStart
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-100 hover:border-emerald-400'
                        : pt.isEnd
                        ? 'bg-purple-950/40 border-purple-700/60 text-purple-100 hover:border-purple-400'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-200 hover:border-emerald-500/70 hover:bg-neutral-900'
                    }`}
                    title="Click to view and center on map"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        {pt.isStart && <MapPin className="w-3 h-3 text-emerald-400" />}
                        {pt.isEnd && <Flag className="w-3 h-3 text-purple-400" />}
                        {!pt.isStart && !pt.isEnd && (
                          <span className="w-4 h-4 rounded-full bg-neutral-800 text-emerald-300 flex items-center justify-center text-[9px] font-bold">
                            {pt.stepNumber}
                          </span>
                        )}
                        <span>Step {pt.stepNumber}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold tracking-wide ${
                          pt.isStart
                            ? 'bg-emerald-500 text-white'
                            : pt.isEnd
                            ? 'bg-purple-600 text-white'
                            : pt.tag === 'HIGH GROUND'
                            ? 'bg-cyan-700 text-white'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {pt.tag}
                      </span>
                    </div>

                    <div className="font-bold text-xs truncate mb-1 text-white" title={pt.title}>
                      {pt.title}
                    </div>

                    <div className="text-[10px] text-neutral-400 font-medium flex items-center justify-between gap-1">
                      <span className="truncate">{pt.desc}</span>
                      <span className="text-[9px] text-emerald-400/70 shrink-0 font-mono">📍 Map</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stadia Cartography Configuration Modal */}
      <StadiaKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentStyle={mapStyle}
        onChangeStyle={setMapStyle}
        isEmergencyMode={isEmergencyMode}
      />
    </div>
  );
};
