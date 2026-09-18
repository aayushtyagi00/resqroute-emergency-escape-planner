import React, { useState } from 'react';
import {
  X,
  MapPin,
  Flame,
  Waves,
  Mountain,
  Activity,
  AlertTriangle,
  Users,
  Car,
  Footprints,
  Truck,
  Bike,
  Bus,
  Check,
  Shield,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Satellite,
  Compass,
  HardDrive,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Trash2,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { DisasterType, EmergencySetup, TransportMode, VulnerabilityFlags } from '../types';
import {
  downloadOfflineMapTiles,
  clearOfflineMapTiles,
  getStoredOfflineState,
  INITIAL_OFFLINE_STORAGE,
} from '../utils/offlineTileCache';

interface EmergencySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSetup: EmergencySetup;
  onSaveSetup: (setup: EmergencySetup) => void;
  isEmergencyMode: boolean;
}

const UNIVERSAL_LOCATION_PRESETS = [
  { label: 'Downtown / City Core', name: 'Downtown Metropolitan Center', lat: 28.6139, lng: 77.2090 },
  { label: 'Riverfront Basin', name: 'Riverfront Embankment Sector', lat: 28.6505, lng: 77.2300 },
  { label: 'Mountain Pass & Ridge', name: 'Mountain Ridge Highway Pass', lat: 31.1048, lng: 77.1734 },
  { label: 'Coastal Harbor', name: 'Coastal Harbor & Waterfront', lat: 18.9220, lng: 72.8347 },
  { label: 'Suburban Valley', name: 'Suburban Lowland Sector', lat: 28.5355, lng: 77.3910 },
];

export const EmergencySetupModal: React.FC<EmergencySetupModalProps> = ({
  isOpen,
  onClose,
  currentSetup,
  onSaveSetup,
  isEmergencyMode,
}) => {
  const [formData, setFormData] = useState<EmergencySetup>(() => ({
    ...currentSetup,
    offlineTilesEnabled: currentSetup.offlineTilesEnabled ?? true,
    offlineStorage: currentSetup.offlineStorage || getStoredOfflineState(),
  }));
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<boolean>(formData.locationSource === 'gps');

  // Offline Tile Management State
  const [isDownloadingTiles, setIsDownloadingTiles] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(
    formData.offlineStorage?.downloadProgress ?? 100
  );
  const [downloadStatusText, setDownloadStatusText] = useState<string>('');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [showSectorDetails, setShowSectorDetails] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartDownloadTiles = async () => {
    setIsDownloadingTiles(true);
    setDownloadSuccessToast(null);
    try {
      const updatedStorage = await downloadOfflineMapTiles((progress, label) => {
        setDownloadProgress(progress);
        setDownloadStatusText(label);
      });
      setFormData((prev) => ({
        ...prev,
        offlineTilesEnabled: true,
        offlineStorage: updatedStorage,
      }));
      setDownloadSuccessToast('All 144 vector map tiles and elevation contours stored offline!');
      setTimeout(() => setDownloadSuccessToast(null), 4500);
    } catch {
      setDownloadStatusText('Failed to cache tiles. Please retry.');
    } finally {
      setIsDownloadingTiles(false);
    }
  };

  const handleToggleOfflineTiles = async (enabled: boolean) => {
    if (enabled && (!formData.offlineStorage || !formData.offlineStorage.tilesDownloaded)) {
      setFormData((prev) => ({ ...prev, offlineTilesEnabled: true }));
      await handleStartDownloadTiles();
    } else {
      setFormData((prev) => ({
        ...prev,
        offlineTilesEnabled: enabled,
      }));
    }
  };

  const handleClearTiles = async () => {
    const cleared = await clearOfflineMapTiles();
    setFormData((prev) => ({
      ...prev,
      offlineTilesEnabled: false,
      offlineStorage: cleared,
    }));
    setDownloadProgress(0);
    setDownloadStatusText('');
  };

  const handleToggleSimulateOffline = () => {
    setFormData((prev) => {
      const currentSim = prev.offlineStorage?.isSimulatedOffline ?? false;
      const updated = {
        ...(prev.offlineStorage || INITIAL_OFFLINE_STORAGE),
        isSimulatedOffline: !currentSim,
      };
      return {
        ...prev,
        offlineStorage: updated,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSetup(formData);
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Web Geolocation API is not supported by your current browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);
    setGeoSuccess(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 0);

        const latStr = lat >= 0 ? `${lat.toFixed(4)}°N` : `${Math.abs(lat).toFixed(4)}°S`;
        const lngStr = lng >= 0 ? `${lng.toFixed(4)}°E` : `${Math.abs(lng).toFixed(4)}°W`;
        let resolvedName = `Current GPS (${latStr}, ${lngStr})`;

        // Non-blocking client-side reverse geocoding via OpenStreetMap Nominatim
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
            {
              signal: controller.signal,
              headers: { 'Accept-Language': 'en' },
            }
          );
          clearTimeout(timer);
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const locality =
                data.address.neighbourhood ||
                data.address.suburb ||
                data.address.road ||
                data.address.city_district ||
                data.address.town ||
                data.address.village ||
                data.address.city;
              const region = data.address.city || data.address.state_district || data.address.state;
              if (locality && region) {
                resolvedName = `${locality}, ${region}`;
              } else if (data.display_name) {
                resolvedName = data.display_name.split(',').slice(0, 2).join(',').trim();
              }
            }
          }
        } catch {
          // Fallback to coordinates
        }

        setFormData((prev) => ({
          ...prev,
          location: resolvedName,
          latitude: lat,
          longitude: lng,
          accuracy: accuracy,
          locationSource: 'gps',
        }));
        setGeoLoading(false);
        setGeoSuccess(true);
      },
      (error) => {
        setGeoLoading(false);
        let msg = 'Failed to fetch GPS coordinates.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied in browser. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'GPS satellite signal or location data is currently unavailable.';
            break;
          case error.TIMEOUT:
            msg = 'Location acquisition timed out. Please try again.';
            break;
        }
        setGeoError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000,
      }
    );
  };

  const toggleVulnerability = (key: keyof VulnerabilityFlags) => {
    setFormData((prev) => ({
      ...prev,
      vulnerabilities: {
        ...prev.vulnerabilities,
        [key]: !prev.vulnerabilities[key],
      },
    }));
  };

  const hasCoords = typeof formData.latitude === 'number' && typeof formData.longitude === 'number';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-t-3xl sm:rounded-2xl border-t sm:border p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col transition-all ${
          isEmergencyMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight truncate">Configure Incident Profile</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Tailor routing weights to live GPS coordinates and vulnerabilities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close setup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {/* Location Field with Real Web Geolocation API */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                Evacuation Origin Location
              </label>

              {/* Get Current Location Button */}
              <button
                type="button"
                id="btn-get-current-location"
                onClick={handleGetCurrentLocation}
                disabled={geoLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white shadow-xs transition cursor-pointer"
                title="Fetch live latitude and longitude using Web Geolocation API"
              >
                {geoLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Locating GPS...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    <span>Get Current Location</span>
                  </>
                )}
              </button>
            </div>

            {/* Location Input */}
            <div className="relative">
              <input
                type="text"
                id="input-emergency-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: e.target.value,
                    locationSource: 'manual',
                  })
                }
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 shadow-xs placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium transition-all"
                placeholder="Enter current location or tap 'Get Current Location'..."
                required
              />
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-neutral-500 pointer-events-none" />
            </div>

            {/* Live GPS Coordinates Telemetry Display */}
            {hasCoords ? (
              <div
                id="gps-coordinates-telemetry"
                className={`p-3.5 rounded-2xl border text-xs shadow-xs transition-all ${
                  formData.locationSource === 'gps'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200'
                    : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-neutral-100">
                    <Satellite
                      className={`w-4 h-4 ${
                        formData.locationSource === 'gps'
                          ? 'text-emerald-600 dark:text-emerald-400 animate-pulse'
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}
                    />
                    <span>
                      {formData.locationSource === 'gps'
                        ? 'Live GPS Fix (Web Geolocation API)'
                        : 'Calibrated Geocoordinates'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      formData.locationSource === 'gps'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-600'
                    }`}
                  >
                    {formData.locationSource === 'gps' ? 'Actual Device GPS' : 'Geocoded'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <span className="text-[10px] block font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Latitude</span>
                    <span className="font-mono text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                      {formData.latitude?.toFixed(6)}° {formData.latitude! >= 0 ? 'N' : 'S'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <span className="text-[10px] block font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Longitude</span>
                    <span className="font-mono text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                      {formData.longitude?.toFixed(6)}° {formData.longitude! >= 0 ? 'E' : 'W'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] block font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Accuracy</span>
                    <span className="font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formData.accuracy ? `±${formData.accuracy} m` : 'High Precision'}
                    </span>
                  </div>
                </div>

                {geoSuccess && (
                  <p className="mt-2.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Real-world device coordinates successfully acquired and mapped.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  No GPS coordinates attached. Tap &quot;Get Current Location&quot; to fetch live device position.
                </span>
              </div>
            )}

            {/* Geolocation Error Notice */}
            {geoError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="space-y-0.5">
                  <p className="font-semibold">{geoError}</p>
                  <p className="text-[11px] opacity-90">
                    You can still type any custom location or select one of the universal disaster terrain presets below.
                  </p>
                </div>
              </div>
            )}

            {/* Universal Presets (Not limited to any single valley or city) */}
            <div>
              <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 block mb-1.5">
                Universal Terrain & Geographic Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {UNIVERSAL_LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        location: preset.name,
                        latitude: preset.lat,
                        longitude: preset.lng,
                        accuracy: 20,
                        locationSource: 'preset',
                      });
                      setGeoError(null);
                      setGeoSuccess(false);
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                      formData.location === preset.name
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 font-bold shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Type Radio Grid */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-neutral-800 dark:text-neutral-200">
              Active Disaster Threat Scenario
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'flash_flood', label: 'Flash Flood', icon: <Waves className="w-4 h-4 text-blue-500" /> },
                { id: 'landslide', label: 'Landslide', icon: <Mountain className="w-4 h-4 text-amber-600" /> },
                { id: 'wildfire', label: 'Wildfire', icon: <Flame className="w-4 h-4 text-red-500" /> },
                { id: 'earthquake', label: 'Earthquake', icon: <Activity className="w-4 h-4 text-orange-500" /> },
                { id: 'accident', label: 'Major Accident', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
              ].map((disaster) => (
                <button
                  key={disaster.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, emergencyType: disaster.id as DisasterType })}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                    formData.emergencyType === disaster.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500 shadow-2xs font-bold'
                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs'
                  }`}
                >
                  {disaster.icon}
                  <span>{disaster.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* People Count & Transport Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <Users className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" /> Total Evacuees
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 4, 6, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setFormData({ ...formData, peopleCount: count })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      formData.peopleCount === count
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* Transport Mode */}
            <div>
              <label className="block text-xs font-bold mb-1.5 text-neutral-800 dark:text-neutral-200">
                Primary Transport Mode
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'car', icon: <Car className="w-3.5 h-3.5" />, label: 'Car' },
                  { id: 'walking', icon: <Footprints className="w-3.5 h-3.5" />, label: 'Foot' },
                  { id: 'ambulance', icon: <Truck className="w-3.5 h-3.5" />, label: 'Ambulance' },
                  { id: 'bike', icon: <Bike className="w-3.5 h-3.5" />, label: 'Bike' },
                  { id: 'bus', icon: <Bus className="w-3.5 h-3.5" />, label: 'Bus' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, transportMode: mode.id as TransportMode })}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border flex flex-col items-center gap-1 transition cursor-pointer ${
                      formData.transportMode === mode.id
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs'
                    }`}
                    title={mode.label}
                  >
                    {mode.icon}
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vulnerability Checkboxes */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-neutral-800 dark:text-neutral-200">
              Vulnerable Group Members (Personalized Risk Profiling)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'elderly', label: '👵 Elderly', desc: 'Avoids steep slopes' },
                { key: 'children', label: '👶 Children', desc: 'Prioritizes shelters' },
                { key: 'injured', label: '🩹 Injured', desc: 'Prioritizes hospitals' },
                { key: 'disabled', label: '♿ Disabled', desc: 'Strictly paved roads' },
              ].map((item) => {
                const isActive = formData.vulnerabilities[item.key as keyof VulnerabilityFlags];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleVulnerability(item.key as keyof VulnerabilityFlags)}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500 shadow-2xs'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs mb-0.5">
                      <span>{item.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offline Map Tiles & Tactical Navigation Cache Toggle Section */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 shadow-xs transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      formData.offlineTilesEnabled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Download Map Tiles for Offline Usage
                      </h3>
                      {formData.offlineTilesEnabled && formData.offlineStorage?.tilesDownloaded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Offline Ready ({formData.offlineStorage.totalSizeMb} MB)
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {formData.offlineTilesEnabled ? 'Pending Download' : 'Disabled'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                      Download and cache 144 vector map tiles, +320m topographic elevation contours, and safe evacuation corridors. Navigation, GPS positioning, and route recalculation remain 100% functional even when cell towers collapse and internet is lost.
                    </p>
                  </div>
                </div>

                {/* Primary Toggle Switch */}
                <button
                  type="button"
                  id="toggle-offline-map-tiles"
                  role="switch"
                  aria-checked={formData.offlineTilesEnabled}
                  aria-label="Download map tiles for offline usage"
                  onClick={() => handleToggleOfflineTiles(!formData.offlineTilesEnabled)}
                  disabled={isDownloadingTiles}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    formData.offlineTilesEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.offlineTilesEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Downloading State Progress */}
              {isDownloadingTiles && (
                <div className="mt-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-emerald-500/30 shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>{downloadStatusText || 'Caching offline vector map tiles...'}</span>
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Offline Tiles Active Telemetry & Management */}
              {formData.offlineTilesEnabled && !isDownloadingTiles && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5">
                  {/* Download Toast Alert */}
                  {downloadSuccessToast && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium">{downloadSuccessToast}</span>
                    </div>
                  )}

                  {/* Storage Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      <span className="text-[10px] block uppercase font-bold text-neutral-500 dark:text-neutral-400">Total Tiles</span>
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formData.offlineStorage?.totalTiles ?? 144} Tiles
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      <span className="text-[10px] block uppercase font-bold text-neutral-500 dark:text-neutral-400">Cache Size</span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formData.offlineStorage?.totalSizeMb ?? 18.4} MB
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      <span className="text-[10px] block uppercase font-bold text-neutral-500 dark:text-neutral-400">Offline Status</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Protected
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      <span className="text-[10px] block uppercase font-bold text-neutral-500 dark:text-neutral-400">Cache Pack</span>
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate block">
                        {formData.offlineStorage?.cacheVersion ?? 'v2.4-carto'}
                      </span>
                    </div>
                  </div>

                  {/* Sector Details Collapsible */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowSectorDetails((prev) => !prev)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{showSectorDetails ? 'Hide Sector Details' : 'View 5 Cached Terrain Sectors'}</span>
                    </button>

                    {showSectorDetails && (
                      <div className="mt-2 space-y-1.5 pl-1">
                        {(formData.offlineStorage?.sectors || []).map((sec) => (
                          <div
                            key={sec.id}
                            className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                                {sec.name}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {sec.description}
                              </div>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-neutral-700 dark:text-neutral-300 shrink-0">
                              {sec.tileCount} tiles ({sec.sizeMb}MB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Offline Cache Actions & Offline Simulation Test */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleStartDownloadTiles}
                        disabled={isDownloadingTiles}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-2xs transition cursor-pointer"
                        title="Re-download and refresh cached vector tiles"
                      >
                        <RefreshCw className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                        <span>Update Tiles</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearTiles}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-400 bg-white dark:bg-neutral-800 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer shadow-2xs"
                        title="Remove cached tiles from browser storage"
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                        <span>Clear Cache</span>
                      </button>
                    </div>

                    {/* Simulate Internet Loss (Offline Navigation Test) */}
                    <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                      <label
                        htmlFor="simulate-offline-switch"
                        className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 cursor-pointer"
                      >
                        {formData.offlineStorage?.isSimulatedOffline ? (
                          <WifiOff className="w-3 h-3 text-amber-500 animate-pulse" />
                        ) : (
                          <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        )}
                        <span>Simulate Network Loss</span>
                      </label>
                      <button
                        type="button"
                        id="simulate-offline-switch"
                        role="switch"
                        aria-checked={formData.offlineStorage?.isSimulatedOffline ?? false}
                        onClick={handleToggleSimulateOffline}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          formData.offlineStorage?.isSimulatedOffline
                            ? 'bg-amber-500'
                            : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            formData.offlineStorage?.isSimulatedOffline ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          </div>

          {/* Modal Actions Sticky Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
            >
              Recalculate Safe Routes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
