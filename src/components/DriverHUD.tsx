import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Navigation,
  CornerUpRight,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Radio,
  Share2,
  MapPin,
  Compass,
  Gauge,
  Activity,
  Layers,
  CheckCircle2,
  PhoneCall,
  Maximize2,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { RouteOption, Shelter, DangerZone } from '../types';
import { getTileLayerConfig } from '../utils/stadiaMaps';

interface DriverHUDProps {
  activeRoute: RouteOption;
  activeShelter: Shelter;
  dangerZones: DangerZone[];
  isEmergencyMode: boolean;
  onExitHUD: () => void;
  onBroadcastSOS: () => void;
  onTriggerSound: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onFocusOnMap?: (target: {
    type: 'route';
    id: string;
    title?: string;
  }) => void;
}

export const DriverHUD: React.FC<DriverHUDProps> = ({
  activeRoute,
  activeShelter,
  dangerZones,
  isEmergencyMode,
  onExitHUD,
  onBroadcastSOS,
  onTriggerSound,
  isAudioEnabled,
  onToggleAudio,
  onFocusOnMap,
}) => {
  const [speed, setSpeed] = useState(38);
  const [hazardReported, setHazardReported] = useState(false);
  const [rerouteActive, setRerouteActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const hudMapContainerRef = useRef<HTMLDivElement>(null);
  const hudMapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!hudMapContainerRef.current) return;
    if (!hudMapInstanceRef.current) {
      const originLat = activeRoute.pathPoints[0]?.lat ?? 28.6139;
      const originLng = activeRoute.pathPoints[0]?.lng ?? 77.2090;
      const map = L.map(hudMapContainerRef.current, {
        center: [originLat, originLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      const { url, attribution, maxZoom } = getTileLayerConfig('alidade_smooth_dark');
      L.tileLayer(url, { attribution, maxZoom }).addTo(map);

      const destLat = activeShelter?.coordinates?.lat ?? 28.6360;
      const destLng = activeShelter?.coordinates?.lng ?? 77.2180;
      const latLngs: [number, number][] = activeRoute.pathPoints.map((pt, i) => {
        if (i === 0) return [originLat, originLng];
        if (i === activeRoute.pathPoints.length - 1) return [destLat, destLng];
        const lat = pt.lat ?? originLat + 0.01;
        const lng = pt.lng ?? originLng + 0.01;
        return [isNaN(lat) ? originLat : lat, isNaN(lng) ? originLng : lng];
      });

      L.polyline(latLngs, { color: '#10b981', weight: 8, opacity: 0.35 }).addTo(map);
      L.polyline(latLngs, { color: '#10b981', weight: 4, opacity: 1 }).addTo(map);

      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker-hud',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8">
            <span class="absolute w-8 h-8 rounded-full bg-emerald-400/50 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
              <span class="w-1.5 h-1.5 rounded-full bg-black"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([originLat, originLng], { icon: vehicleIcon }).addTo(map);

      const shelterIcon = L.divIcon({
        className: 'shelter-marker-hud',
        html: `
          <div class="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow border-2 border-white text-[11px] font-bold">
            H
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([destLat, destLng], { icon: shelterIcon }).addTo(map);

      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [35, 35] });

      hudMapInstanceRef.current = map;
    }

    return () => {
      if (hudMapInstanceRef.current) {
        hudMapInstanceRef.current.remove();
        hudMapInstanceRef.current = null;
      }
    };
  }, [activeRoute, activeShelter]);

  // Format arrival time based on route minutes
  const arrivalDate = new Date(currentTime.getTime() + activeRoute.timeMinutes * 60000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleReroute = () => {
    onTriggerSound();
    setRerouteActive(true);
    setTimeout(() => setRerouteActive(false), 3000);
  };

  const handleReportHazard = () => {
    onTriggerSound();
    setHazardReported(true);
    setTimeout(() => setHazardReported(false), 3500);
  };

  const occupancyPct = Math.round((activeShelter.capacityOccupied / activeShelter.capacityTotal) * 100);
  const bedsRemaining = activeShelter.capacityTotal - activeShelter.capacityOccupied;

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-emerald-500/30 bg-[#0a0a0a] text-white shadow-2xl">
      {/* 1. Tactical High-Visibility In-Transit Maneuver Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900/90 to-emerald-950 p-4 sm:p-5 border-b border-emerald-500/40 relative">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 font-mono-data">
              LIVE EVACUATION HUD • GPS RTK LOCKED ±0.2M
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onFocusOnMap && (
              <button
                type="button"
                onClick={() => {
                  onExitHUD();
                  onFocusOnMap({
                    type: 'route',
                    id: activeRoute.id,
                    title: activeRoute.name,
                  });
                }}
                className="text-xs px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition cursor-pointer flex items-center gap-1.5"
                title="Return to interactive tactical map"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tactical Map</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExitHUD}
              className="text-xs px-3 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-emerald-200 border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit HUD</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <CornerUpRight className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.8]" />
          </div>
          <div className="flex-1">
            <div className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">
              In 400m, TURN RIGHT
            </div>
            <div className="text-sm sm:text-base font-semibold text-emerald-200 mt-1">
              onto {activeRoute.name.split('—')[0]}
            </div>
            <div className="text-xs text-emerald-300/80 mt-1 flex items-center gap-2 flex-wrap">
              <span>Then continue elevated ridge corridor (+14m safety margin)</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-800/80 text-[10px] font-bold text-white">
                100% DRY PAVEMENT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tactical Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-neutral-900/90 border-b border-neutral-800 text-xs">
        <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-2.5">
          <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">Speed</span>
            <span className="text-base font-black font-mono-data text-white">{speed} km/h</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">Elevation</span>
            <span className="text-base font-black font-mono-data text-white">+142m MSL</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">Route Score</span>
            <span className="text-base font-black font-mono-data text-emerald-400">{activeRoute.safetyScore}/100</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block font-bold">Inundation Gap</span>
            <span className="text-base font-black font-mono-data text-amber-300">200m Below</span>
          </div>
        </div>
      </div>

      {/* 3. Central HUD Navigation & Map Visualizer */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Reroute / Hazard Notification Banners */}
        {rerouteActive && (
          <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-200 text-xs flex items-center gap-2 animate-pulse">
            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span className="font-bold">
              Recalculating corridor around reported debris... Optimal detour confirmed via Ridge Bypass (+1.2 mins).
            </span>
          </div>
        )}

        {hazardReported && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold">
              Hazard pin uploaded to mesh dispatch. Central Command & nearby evacuees alerted.
            </span>
          </div>
        )}

        {/* Real Stadia Tile Map Canvas Viewport in HUD */}
        <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-neutral-800 shadow-lg bg-black">
          <div ref={hudMapContainerRef} className="w-full h-full" />
          <div className="absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-300 font-mono-data flex items-center gap-1.5 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>STADIA VECTOR RADAR • IN-TRANSIT</span>
          </div>
        </div>

        {/* Huge Flight-Deck Metric Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 shadow-inner">
          <div className="sm:col-span-1 border-b sm:border-b-0 sm:border-r border-neutral-800 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest block mb-1">
              Time to Safe Haven
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono-data text-white tracking-tight flex items-baseline gap-2">
              <span>{activeRoute.timeMinutes}</span>
              <span className="text-xl font-bold text-emerald-400">MINS</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1 font-mono-data">
              Estimated Safe Arrival: <strong className="text-white">{arrivalTimeStr}</strong>
            </div>
          </div>

          <div className="sm:col-span-2 flex flex-col justify-center sm:pl-2">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-400 font-medium">Distance to Shelter</span>
              <span className="font-bold font-mono-data text-white">{activeRoute.distanceKm} km remaining</span>
            </div>
            <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                style={{ width: '45%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 98% Corridor Clearance
              </span>
              <span>Speed Limit: 50 km/h</span>
            </div>
          </div>
        </div>

        {/* Safe Haven Reservation Assurance Card */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800/80 text-purple-300 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                Confirmed Destination
              </div>
              <div className="text-sm font-bold text-white">{activeShelter.name}</div>
              <div className="text-xs text-neutral-400">
                {bedsRemaining} beds remaining • Medical bay operational
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono-data">
            {occupancyPct}% OCCUPIED • SPACE RESERVED
          </span>
        </div>

        {/* 4. Oversized Tactile Driver Action Bar (Glove-Friendly Tap Targets) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={handleReroute}
            className="py-3 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reroute Hazard</span>
          </button>

          <button
            onClick={handleReportHazard}
            className="py-3 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Report Debris</span>
          </button>

          <button
            onClick={onToggleAudio}
            className="col-span-2 sm:col-span-1 py-3 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 cursor-pointer shadow active:scale-95"
          >
            {isAudioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span>Voice: MUTED</span>
              </>
            )}
          </button>
        </div>

        {/* Full-Width Tactical Emergency SOS Broadcast Button */}
        <button
          onClick={onBroadcastSOS}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-red-600/30 active:scale-[0.98] emergency-beacon-pulse"
        >
          <Radio className="w-5 h-5 text-white animate-pulse" />
          <span>BROADCAST EMERGENCY SOS / DISPATCH MAYDAY</span>
        </button>
      </div>
    </div>
  );
};
