import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ShieldAlert,
  MapPin,
  Sparkles,
  Home,
  Briefcase,
  Bot,
  SlidersHorizontal,
  Clock,
  Milestone,
  Navigation,
  CheckCircle2,
  Share2,
  Radio,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { InteractiveMap } from './components/InteractiveMap';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { RouteComparison } from './components/RouteComparison';
import { ShelterHospitalPanel } from './components/ShelterHospitalPanel';
import { EmergencyChecklist } from './components/EmergencyChecklist';
import { AIAdvisorCard } from './components/AIAdvisorCard';
import { IoTSensorGrid } from './components/IoTSensorGrid';
import { DriverHUD } from './components/DriverHUD';
import { EmergencySetupModal } from './components/EmergencySetupModal';
import { HackathonArchitectureModal } from './components/HackathonArchitectureModal';
import { GeminiKeyModal } from './components/GeminiKeyModal';
import { INITIAL_SETUP } from './data/mockData';
import {
  EmergencySetup,
  WhatIfScenario,
  Shelter,
  Hospital,
  RouteOption,
  DangerZone,
  IoTSensor,
} from './types';
import { computeEmergencyPlan } from './utils/routeEngine';
import { soundEffects } from './utils/soundEffects';

export default function App() {
  // Core application states with resilient local storage persistence
  const [setup, setSetup] = useState<EmergencySetup>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resqroute_setup_v1');
        if (saved) return { ...INITIAL_SETUP, ...JSON.parse(saved) };
      } catch {}
    }
    return INITIAL_SETUP;
  });

  const [scenario, setScenario] = useState<WhatIfScenario>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resqroute_scenario_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      roadABlocked: false,
      heavyRainSurge: false,
      shelterAlphaFull: false,
      injuredPersonAdded: false,
      evacuationDelayMinutes: 0,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('resqroute_setup_v1', JSON.stringify(setup));
    } catch {}
  }, [setup]);

  useEffect(() => {
    try {
      localStorage.setItem('resqroute_scenario_v1', JSON.stringify(scenario));
    } catch {}
  }, [scenario]);

  // Default theme is BLACK (dark theme), user can toggle and choice persists in localStorage
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resqroute_theme_mode');
        if (saved !== null) {
          return saved === 'black' || saved === 'dark';
        }
      } catch {}
    }
    return true; // Default theme is BLACK
  });

  useEffect(() => {
    try {
      localStorage.setItem('resqroute_theme_mode', isEmergencyMode ? 'black' : 'light');
    } catch {}
    if (isEmergencyMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isEmergencyMode]);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [isArchOpen, setIsArchOpen] = useState<boolean>(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    configured: boolean;
    model: string;
  }>({
    configured: false,
    model: 'gemini-3.6-flash',
  });

  const fetchGeminiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-status');
      if (res.ok) {
        const data = await res.json();
        setGeminiStatus({
          configured: Boolean(data.configured),
          model: data.model || 'gemini-3.6-flash',
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchGeminiStatus();
  }, [fetchGeminiStatus]);

  const [sosToast, setSosToast] = useState<string | null>(null);

  // Network connectivity status for offline navigation
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isEffectiveOffline =
    !isOnline || (setup.offlineStorage?.isSimulatedOffline ?? false);

  // Active view tab for seamless navigation
  const [activeTab, setActiveTab] = useState<'map' | 'hud' | 'routes' | 'whatif' | 'shelters' | 'checklist' | 'ai' | 'sensors'>('map');

  // Unified Map Focus Target for cross-tab synchronization
  const [mapFocusTarget, setMapFocusTarget] = useState<{
    type: 'shelter' | 'hospital' | 'sensor' | 'route' | 'point';
    id?: string;
    lat?: number;
    lng?: number;
    zoom?: number;
    title?: string;
    timestamp?: number;
  } | null>(null);

  const handleFocusOnMap = (target: {
    type: 'shelter' | 'hospital' | 'sensor' | 'route' | 'point';
    id?: string;
    lat?: number;
    lng?: number;
    zoom?: number;
    title?: string;
  }) => {
    setMapFocusTarget({
      ...target,
      timestamp: Date.now(),
    });
    if (target.type === 'route' && target.id) {
      setSelectedRouteId(target.id);
    }
    if (target.type === 'shelter' && target.id) {
      setSelectedShelterId(target.id);
    }
    setActiveTab('map');
  };

  // Live Real Map Data synchronized dynamically based on user's GPS coordinates
  interface LiveMapData {
    cityName?: string;
    locationLabel?: string;
    shelters?: Shelter[];
    hospitals?: Hospital[];
    routes?: RouteOption[];
    dangerZones?: DangerZone[];
    sensors?: IoTSensor[];
  }

  const [liveMapData, setLiveMapData] = useState<LiveMapData | null>(null);
  const [isFetchingLiveData, setIsFetchingLiveData] = useState<boolean>(false);
  const lastFetchedCoordsRef = useRef<string>('');

  const fetchLiveMapData = useCallback(async (lat: number, lng: number) => {
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (lastFetchedCoordsRef.current === key) return;
    lastFetchedCoordsRef.current = key;

    setIsFetchingLiveData(true);
    try {
      const res = await fetch(`/api/places/live?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLiveMapData({
            cityName: data.cityName,
            locationLabel: data.locationLabel,
            shelters: data.shelters,
            hospitals: data.hospitals,
            routes: data.routes,
            dangerZones: data.dangerZones,
            sensors: data.sensors,
          });
          if (data.cityName && data.locationLabel) {
            setSetup((prev) => ({
              ...prev,
              location: data.locationLabel,
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live location map data:', err);
    } finally {
      setIsFetchingLiveData(false);
    }
  }, []);

  // Fetch real local map data when GPS coordinates change
  useEffect(() => {
    const lat = setup.latitude ?? 28.6139;
    const lng = setup.longitude ?? 77.2090;
    fetchLiveMapData(lat, lng);
  }, [setup.latitude, setup.longitude, fetchLiveMapData]);

  const handleUpdateOriginCoords = (lat: number, lng: number) => {
    setSetup((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: `Pinned GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
    }));
    if (isAudioEnabled) {
      soundEffects.playRerouteChime();
    }
    fetchLiveMapData(lat, lng);
  };

  // Cross-component tab navigation listener for Leaflet HTML popups
  useEffect(() => {
    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetTab = customEvent.detail;
      if (['map', 'hud', 'routes', 'whatif', 'shelters', 'checklist', 'ai', 'sensors'].includes(targetTab)) {
        setActiveTab(targetTab as any);
      }
    };
    document.addEventListener('resqroute-navigate-tab', handleCustomNav);
    return () => document.removeEventListener('resqroute-navigate-tab', handleCustomNav);
  }, []);

  // Compute emergency routing outcome based on setup and what-if permutations
  const plan = useMemo(() => {
    return computeEmergencyPlan(setup, scenario, liveMapData || undefined);
  }, [setup, scenario, liveMapData]);

  const [selectedRouteId, setSelectedRouteId] = useState<string>(plan.recommendedRoute.id);
  const [selectedShelterId, setSelectedShelterId] = useState<string>(plan.recommendedShelter.id);

  // Sync recommendation when plan shifts (guarded so initial mount doesn't violate audio policy)
  const isInitialMount = useRef(true);
  useEffect(() => {
    setSelectedRouteId(plan.recommendedRoute.id);
    setSelectedShelterId(plan.recommendedShelter.id);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isAudioEnabled) {
      soundEffects.playRerouteChime();
    }
  }, [plan.recommendedRoute.id, plan.recommendedShelter.id, isAudioEnabled]);

  const activeRoute = plan.routes.find((r) => r.id === selectedRouteId) || plan.recommendedRoute;
  const activeShelter = plan.shelters ? plan.shelters.find((s: any) => s.id === selectedShelterId) || plan.recommendedShelter : plan.recommendedShelter;

  const handleToggleEmergencyMode = () => {
    if (isAudioEnabled) {
      soundEffects.playAlertTone();
    }
    setIsEmergencyMode((prev) => !prev);
  };

  const handleToggleAudio = () => {
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    soundEffects.enabled = next;
  };

  const handleResetScenario = () => {
    if (isAudioEnabled) soundEffects.playRerouteChime();
    setScenario({
      roadABlocked: false,
      heavyRainSurge: false,
      shelterAlphaFull: false,
      injuredPersonAdded: false,
      evacuationDelayMinutes: 0,
    });
  };

  // Broadcast Emergency SOS & Live Coordinates via Web Share API or Clipboard
  const handleShareSOS = async () => {
    const latStr = setup.latitude !== undefined ? `${setup.latitude.toFixed(4)}°N` : 'N/A';
    const lngStr = setup.longitude !== undefined ? `${setup.longitude.toFixed(4)}°E` : 'N/A';
    const activeVulns =
      Object.entries(setup.vulnerabilities)
        .filter(([_, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ') || 'None';

    const broadcastText = `🚨 RESQROUTE EMERGENCY EVACUATION BROADCAST
Incident: ${setup.emergencyType.toUpperCase()} (Threat: ${plan.overallThreatLevel})
Location: ${setup.location} (${latStr}, ${lngStr})
Group Size: ${setup.peopleCount} (${setup.transportMode.toUpperCase()})
Vulnerabilities: ${activeVulns}
Recommended Route: ${plan.recommendedRoute.name} (Safety Score: ${plan.recommendedRoute.safetyScore}/100, ETA: ${plan.recommendedRoute.timeMinutes}m)
Designated Shelter: ${plan.recommendedShelter.name} (${plan.recommendedShelter.distanceKm} km)
Timestamp: ${new Date().toLocaleTimeString()}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `ResQRoute Emergency SOS: ${setup.location}`,
          text: broadcastText,
        });
        setSosToast('SOS Evacuation Broadcast successfully shared!');
        setTimeout(() => setSosToast(null), 4000);
        return;
      } catch {
        // Fall through to clipboard if share cancelled
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(broadcastText);
        setSosToast('Emergency SOS message copied to clipboard! Ready to paste into SMS or WhatsApp.');
        setTimeout(() => setSosToast(null), 4500);
        return;
      } catch {}
    }

    setSosToast('SOS broadcast generated. Please copy status manually.');
    setTimeout(() => setSosToast(null), 3000);
  };

  const hasInjured = setup.vulnerabilities.injured || scenario.injuredPersonAdded;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isEmergencyMode
          ? 'bg-neutral-950 text-neutral-100 font-sans'
          : 'bg-neutral-100/70 text-neutral-900 font-sans'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        emergencyType={setup.emergencyType}
        location={setup.location}
        latitude={setup.latitude}
        longitude={setup.longitude}
        locationSource={setup.locationSource}
        isEmergencyMode={isEmergencyMode}
        onToggleEmergencyMode={handleToggleEmergencyMode}
        isAudioEnabled={isAudioEnabled}
        onToggleAudio={handleToggleAudio}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenArchitecture={() => setIsArchOpen(true)}
        threatLevel={plan.overallThreatLevel}
        offlineTilesEnabled={setup.offlineTilesEnabled}
        isOffline={isEffectiveOffline}
        onShareSOS={handleShareSOS}
        geminiConfigured={geminiStatus.configured}
        geminiModel={geminiStatus.model}
        onOpenGeminiSettings={() => setIsGeminiModalOpen(true)}
      />

      {/* Floating SOS Broadcast Notification Toast */}
      {sosToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-3 duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{sosToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        {/* Live GPS Map Localization Indicator */}
        {liveMapData?.cityName && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 shadow-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="font-semibold">
                📍 Live Map Data Synchronized: <strong className="font-bold text-neutral-900 dark:text-white">{liveMapData.cityName}</strong>
              </span>
              <span className="text-[11px] opacity-80 hidden sm:inline">
                ({plan.shelters?.length || 0} shelters, {plan.hospitals?.length || 0} hospitals & OSRM road routes)
              </span>
            </div>
            {isFetchingLiveData ? (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                Fetching live facilities...
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs">
                Real Local Data Active
              </span>
            )}
          </div>
        )}

        {/* Unified Executive Situation Ribbon (Clean, non-nested, glanceable) */}
        <div
          className={`rounded-2xl border p-3 sm:p-3.5 shadow-sm transition-all ${
            isEmergencyMode
              ? 'bg-neutral-900/80 border-neutral-800'
              : 'bg-white border-neutral-200'
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-800">
            {/* 1: Recommended Safe Route */}
            <div
              onClick={() => {
                handleFocusOnMap({
                  type: 'route',
                  id: plan.recommendedRoute.id,
                  title: plan.recommendedRoute.name,
                });
              }}
              className="cursor-pointer group flex items-start gap-2.5 pt-1 sm:pt-0 sm:px-2 first:px-0"
              title="Click to view and trace recommended route on interactive map"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                  <span>Safest Route</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                  {plan.recommendedRoute.name.split('—')[0]}
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span>Score: {plan.recommendedRoute.safetyScore}/100</span>
                  <span>•</span>
                  <span>{plan.recommendedRoute.timeMinutes}m</span>
                </div>
              </div>
            </div>

            {/* 2: Designated Safe Shelter */}
            <div
              onClick={() => {
                handleFocusOnMap({
                  type: 'shelter',
                  id: plan.recommendedShelter.id,
                  lat: plan.recommendedShelter.coordinates?.lat,
                  lng: plan.recommendedShelter.coordinates?.lng,
                  title: plan.recommendedShelter.name,
                });
              }}
              className="cursor-pointer group flex items-start gap-2.5 pt-2 sm:pt-0 sm:px-3"
              title="Click to pinpoint primary safe shelter on interactive map"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Home className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
                  Safe Haven
                </span>
                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                  {plan.recommendedShelter.name.split('Senior')[0]}
                </div>
                <div className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 flex items-center gap-1 mt-0.5">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {Math.round((plan.recommendedShelter.capacityOccupied / plan.recommendedShelter.capacityTotal) * 100)}% Cap
                  </span>
                  <span>•</span>
                  <span>{plan.recommendedShelter.distanceKm} km</span>
                </div>
              </div>
            </div>

            {/* 3: Evacuation Window Margin */}
            <div
              onClick={() => {
                handleFocusOnMap({
                  type: 'sensor',
                  id: 'sensor-1',
                  lat: 28.6180,
                  lng: 77.2150,
                  title: 'Yamuna Flood Level Gauge',
                });
              }}
              className="cursor-pointer group flex items-start gap-2.5 pt-2 sm:pt-0 sm:px-3"
              title="Click to pinpoint critical flood sensor on interactive map"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
                  Evac Window
                </span>
                <div className="font-mono font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                  ~{plan.evacuationWindowMinutes} mins safe
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">
                  Rising water (+12cm/h)
                </div>
              </div>
            </div>

            {/* 4: Evacuee Party Profile */}
            <div
              onClick={() => {
                if (setup.latitude && setup.longitude) {
                  handleFocusOnMap({
                    type: 'point',
                    lat: setup.latitude,
                    lng: setup.longitude,
                    zoom: 15,
                    title: `Start GPS Beacon (${setup.location})`,
                  });
                } else {
                  setIsSetupOpen(true);
                }
              }}
              className="cursor-pointer group flex items-start gap-2.5 pt-2 sm:pt-0 sm:px-3 last:pr-0"
              title="Click to center on your evacuation start beacon or adjust party"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 block">
                  Party Profile
                </span>
                <div className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                  {setup.peopleCount} Evacuees ({setup.transportMode.toUpperCase()})
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 truncate">
                  {Object.entries(setup.vulnerabilities)
                    .filter(([_, v]) => v)
                    .map(([k]) => k.toUpperCase())
                    .join(', ') || 'GENERAL PUBLIC'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto pb-1 gap-2 no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'map', label: 'Tactical Map', icon: <MapPin className="w-3.5 h-3.5" /> },
              { id: 'hud', label: 'Driver HUD', icon: <Navigation className="w-3.5 h-3.5 text-emerald-400" /> },
              { id: 'routes', label: 'Route Comparison', icon: <Milestone className="w-3.5 h-3.5" /> },
              { id: 'whatif', label: 'What-If Simulator', icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" /> },
              { id: 'shelters', label: 'Shelters & Hospitals', icon: <Home className="w-3.5 h-3.5" /> },
              { id: 'checklist', label: 'Survival Kit', icon: <Briefcase className="w-3.5 h-3.5" /> },
              { id: 'ai', label: 'AI Advisor', icon: <Bot className="w-3.5 h-3.5 text-emerald-500" /> },
              { id: 'sensors', label: 'IoT Telemetry', icon: <Radio className="w-3.5 h-3.5" /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? isEmergencyMode
                        ? 'bg-neutral-800 text-white shadow-sm ring-1 ring-neutral-700'
                        : 'bg-neutral-900 text-white shadow-sm'
                      : isEmergencyMode
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setIsArchOpen(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              How does ResQRoute calculate safety scores?
            </button>
          </div>
        </div>

        {/* Tab Content Display */}

        {/* 0. In-Transit Mobile Driver HUD Tab (Google Stitch Screen 3) */}
        {activeTab === 'hud' && (
          <DriverHUD
            activeRoute={activeRoute}
            activeShelter={activeShelter}
            dangerZones={plan.dangerZones}
            isEmergencyMode={isEmergencyMode}
            onExitHUD={() => setActiveTab('map')}
            onBroadcastSOS={handleShareSOS}
            onTriggerSound={() => isAudioEnabled && soundEffects.playAlertTone()}
            isAudioEnabled={isAudioEnabled}
            onToggleAudio={handleToggleAudio}
            onFocusOnMap={handleFocusOnMap}
          />
        )}

        {/* 1. Tactical Map View (Focused, non-nested) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* Quick Route Selector Bar right above the map */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mr-1">
                  Active Evacuation Path:
                </span>
                {plan.routes.map((r) => {
                  const isSelected = r.id === selectedRouteId;
                  const isRecommended = r.id === plan.recommendedRoute.id;
                  const isBlocked = r.status === 'blocked';
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRouteId(r.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : isBlocked
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 opacity-85'
                          : isEmergencyMode
                          ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {isRecommended && <span>★</span>}
                      <span>{r.name.split('—')[0]}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected
                            ? 'bg-emerald-700 text-white'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {isBlocked ? 'BLOCKED' : `${r.safetyScore} pts`}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('hud')}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start Driver HUD &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('routes')}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Milestone className="w-3.5 h-3.5" />
                  <span>Compare Routes &rarr;</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('whatif')}
                  className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Stress Simulator &rarr;</span>
                </button>
              </div>
            </div>

            {/* The Tactical Map */}
            <InteractiveMap
              routes={plan.routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              dangerZones={plan.dangerZones}
              shelters={plan.shelters || []}
              selectedShelterId={selectedShelterId}
              onSelectShelter={setSelectedShelterId}
              hospitals={plan.hospitals || []}
              sensors={plan.sensors}
              isEmergencyMode={isEmergencyMode}
              roadABlocked={scenario.roadABlocked}
              heavyRainSurge={scenario.heavyRainSurge}
              userOrigin={setup}
              onOpenSetup={() => setIsSetupOpen(true)}
              offlineTilesEnabled={setup.offlineTilesEnabled}
              offlineStorage={setup.offlineStorage}
              isOffline={isEffectiveOffline}
              mapFocusTarget={mapFocusTarget}
              onUpdateOriginCoords={handleUpdateOriginCoords}
              onNavigateTab={setActiveTab}
            />
          </div>
        )}

        {/* 2. Route Comparison Tab */}
        {activeTab === 'routes' && (
          <div className="space-y-4">
            <RouteComparison
              routes={plan.routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              isEmergencyMode={isEmergencyMode}
              onFocusOnMap={handleFocusOnMap}
            />

            <div
              className={`p-4 rounded-2xl border ${
                isEmergencyMode
                  ? 'bg-neutral-900 border-neutral-800'
                  : 'bg-white border-neutral-200'
              }`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-neutral-500">
                Algorithm Weight Distribution for Current Scenario
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-semibold">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Disaster Risk</span>
                  <span>{plan.weightBreakdown.disasterRisk}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Road Condition</span>
                  <span>{plan.weightBreakdown.roadCondition}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Distance</span>
                  <span>{plan.weightBreakdown.distance}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Travel Time</span>
                  <span>{plan.weightBreakdown.travelTime}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Traffic</span>
                  <span>{plan.weightBreakdown.traffic}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Shelter Access</span>
                  <span>{plan.weightBreakdown.shelterAccessibility}%</span>
                </div>
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <span className="text-[10px] text-neutral-500 block">Vulnerability Fit</span>
                  <span>{plan.weightBreakdown.vulnerabilityPenalty}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. What-If Simulator Tab */}
        {activeTab === 'whatif' && (
          <div className="space-y-4">
            <WhatIfSimulator
              scenario={scenario}
              onChangeScenario={setScenario}
              routes={plan.routes}
              recommendedRoute={plan.recommendedRoute}
              onReset={handleResetScenario}
              isEmergencyMode={isEmergencyMode}
              onTriggerSound={() => isAudioEnabled && soundEffects.playAlertTone()}
            />

            {/* Render Map preview alongside simulator */}
            <InteractiveMap
              routes={plan.routes}
              selectedRouteId={selectedRouteId}
              onSelectRoute={setSelectedRouteId}
              dangerZones={plan.dangerZones}
              shelters={plan.shelters || []}
              selectedShelterId={selectedShelterId}
              onSelectShelter={setSelectedShelterId}
              hospitals={plan.hospitals || []}
              sensors={plan.sensors}
              isEmergencyMode={isEmergencyMode}
              roadABlocked={scenario.roadABlocked}
              heavyRainSurge={scenario.heavyRainSurge}
              userOrigin={setup}
              showItinerary={false}
              mapFocusTarget={mapFocusTarget}
              onUpdateOriginCoords={handleUpdateOriginCoords}
              onNavigateTab={setActiveTab}
            />
          </div>
        )}

        {/* 4. Shelters & Hospitals Tab */}
        {activeTab === 'shelters' && (
          <ShelterHospitalPanel
            shelters={plan.shelters || []}
            selectedShelterId={selectedShelterId}
            onSelectShelter={setSelectedShelterId}
            hospitals={plan.hospitals || []}
            isEmergencyMode={isEmergencyMode}
            hasInjured={hasInjured}
            onFocusOnMap={handleFocusOnMap}
          />
        )}

        {/* 5. Survival Checklist Tab */}
        {activeTab === 'checklist' && (
          <EmergencyChecklist
            disasterType={setup.emergencyType}
            vulnerabilities={setup.vulnerabilities}
            peopleCount={setup.peopleCount}
            isEmergencyMode={isEmergencyMode}
          />
        )}

        {/* 6. AI Emergency Advisor Tab */}
        {activeTab === 'ai' && (
          <AIAdvisorCard
            setup={setup}
            selectedRoute={activeRoute}
            selectedShelter={activeShelter}
            isEmergencyMode={isEmergencyMode}
            geminiConfigured={geminiStatus.configured}
            onOpenGeminiSettings={() => setIsGeminiModalOpen(true)}
            onFocusOnMap={handleFocusOnMap}
          />
        )}

        {/* 7. IoT Telemetry Tab */}
        {activeTab === 'sensors' && (
          <IoTSensorGrid
            sensors={plan.sensors}
            evacuationWindowMinutes={plan.evacuationWindowMinutes}
            isEmergencyMode={isEmergencyMode}
            onFocusOnMap={handleFocusOnMap}
          />
        )}
      </main>

      {/* Incident Setup Modal */}
      <EmergencySetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        currentSetup={setup}
        onSaveSetup={(newSetup) => {
          setSetup(newSetup);
          if (isAudioEnabled) soundEffects.playRerouteChime();
          if (newSetup.latitude && newSetup.longitude) {
            fetchLiveMapData(newSetup.latitude, newSetup.longitude);
          }
        }}
        isEmergencyMode={isEmergencyMode}
      />

      {/* Hackathon Interdisciplinary Architecture Modal */}
      <HackathonArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
        isEmergencyMode={isEmergencyMode}
      />

      {/* Google Gemini AI Configuration Modal */}
      <GeminiKeyModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        isEmergencyMode={isEmergencyMode}
        isConfigured={geminiStatus.configured}
        currentModel={geminiStatus.model}
        onKeyUpdated={() => {
          fetchGeminiStatus();
          if (isAudioEnabled) soundEffects.playRerouteChime();
        }}
      />

      {/* Footer */}
      <footer
        className={`mt-10 py-6 pb-20 sm:pb-6 border-t text-xs transition-colors ${
          isEmergencyMode
            ? 'bg-neutral-950 border-neutral-900 text-neutral-500'
            : 'bg-white border-neutral-200 text-neutral-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-bold text-neutral-800 dark:text-neutral-200">
              ResQRoute Emergency Escape Planner
            </span>{' '}
            — Intelligent Evacuation & Dynamic Safety Routing System.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsArchOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
            >
              Interdisciplinary Model
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSetupOpen(true)}
              className="hover:underline cursor-pointer"
            >
              Configure Incident
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Dock (sm:hidden) */}
      <nav
        aria-label="Mobile Navigation Dock"
        className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 border-t backdrop-blur-lg flex items-center justify-around shadow-2xl transition-colors ${
          isEmergencyMode
            ? 'bg-neutral-950/95 border-neutral-800 text-neutral-300'
            : 'bg-white/95 border-neutral-200 text-neutral-700'
        }`}
      >
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'map'
              ? 'text-emerald-500 font-bold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Map</span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'routes'
              ? 'text-emerald-500 font-bold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
          }`}
        >
          <Milestone className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Routes</span>
        </button>

        {/* Center Quick GPS / Incident Profile Button */}
        <button
          onClick={() => setIsSetupOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 min-w-[48px] min-h-[48px] w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition transform active:scale-95 cursor-pointer border-2 border-white dark:border-neutral-900"
          title="Update GPS Location or Profile"
          aria-label="Change GPS Location"
        >
          <Navigation className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('whatif')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'whatif'
              ? 'text-purple-500 font-bold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Simulate</span>
        </button>

        <button
          onClick={() => setActiveTab('shelters')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'shelters'
              ? 'text-emerald-500 font-bold'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 font-medium">Shelters</span>
        </button>
      </nav>
    </div>
  );
}
