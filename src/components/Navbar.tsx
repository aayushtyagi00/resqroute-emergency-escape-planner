import React from 'react';
import {
  AlertTriangle,
  Flame,
  Waves,
  Mountain,
  Activity,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  ShieldAlert,
  HardDrive,
  WifiOff,
  Share2,
  Sun,
  Moon,
} from 'lucide-react';
import { DisasterType } from '../types';

interface NavbarProps {
  emergencyType: DisasterType;
  location: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  isEmergencyMode: boolean;
  onToggleEmergencyMode: () => void;
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenSetup: () => void;
  onOpenArchitecture?: () => void;
  threatLevel: string;
  offlineTilesEnabled?: boolean;
  isOffline?: boolean;
  onShareSOS?: () => void;
  geminiConfigured?: boolean;
  geminiModel?: string;
  onOpenGeminiSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  emergencyType,
  location,
  latitude,
  longitude,
  locationSource,
  isEmergencyMode,
  onToggleEmergencyMode,
  isAudioEnabled,
  onToggleAudio,
  onOpenSetup,
  onOpenArchitecture,
  threatLevel,
  offlineTilesEnabled = true,
  isOffline = false,
  onShareSOS,
  geminiConfigured = false,
  geminiModel = 'gemini-3.6-flash',
  onOpenGeminiSettings,
}) => {
  const getDisasterIcon = (type: DisasterType) => {
    switch (type) {
      case 'flash_flood':
        return <Waves className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'landslide':
        return <Mountain className="w-4 h-4 text-amber-500 animate-pulse" />;
      case 'wildfire':
        return <Flame className="w-4 h-4 text-red-500 animate-pulse" />;
      case 'earthquake':
        return <Activity className="w-4 h-4 text-orange-500 animate-pulse" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
  };

  const formatDisasterName = (type: DisasterType) => {
    return type.replace('_', ' ').toUpperCase();
  };

  return (
    <header
      id="resqroute-header"
      className={`border-b transition-colors duration-200 sticky top-0 z-40 backdrop-blur-md ${
        isEmergencyMode
          ? 'bg-neutral-950/90 border-neutral-800 text-white shadow-lg shadow-black/40'
          : 'bg-white/90 border-neutral-200 text-neutral-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md transition-all shrink-0 ${
              threatLevel === 'Critical' || threatLevel === 'Severe'
                ? 'bg-red-600 ring-2 ring-red-400/80 animate-pulse'
                : isEmergencyMode
                ? 'bg-neutral-900 border border-neutral-700 text-emerald-400'
                : 'bg-neutral-900 text-white'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${threatLevel === 'Critical' || threatLevel === 'Severe' ? 'text-white' : isEmergencyMode ? 'text-emerald-400' : 'text-white'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">
                ResQ<span className={isEmergencyMode ? 'text-emerald-400' : 'text-emerald-600'}>Route</span>
              </h1>
              <span
                className={`hidden sm:inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border ${
                  isEmergencyMode
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                Safe Nav
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-neutral-400 truncate">
              Emergency Evacuation & Route Intelligence
            </p>
          </div>
        </div>

        {/* Live Active Incident Pill (Click to re-configure) */}
        <button
          type="button"
          onClick={onOpenSetup}
          className={`hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.01] ${
            isEmergencyMode
              ? 'bg-neutral-900/90 border-neutral-700 text-neutral-200 hover:border-neutral-600'
              : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200/70'
          }`}
          title="Click to calibrate origin coordinates or change incident scenario"
        >
          <div className="flex items-center gap-1.5">
            {getDisasterIcon(emergencyType)}
            <span className="font-bold">{formatDisasterName(emergencyType)}</span>
          </div>
          <span className="text-neutral-500">•</span>
          <span className="truncate max-w-[160px] font-medium">{location}</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              threatLevel === 'Critical' || threatLevel === 'Severe'
                ? 'bg-red-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {threatLevel}
          </span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Offline Navigation Status Pill */}
          {isOffline ? (
            <button
              id="btn-nav-offline-status"
              onClick={onOpenSetup}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 animate-pulse transition-all cursor-pointer"
              title="Internet disconnected. Offline map tiles and autonomous navigation active."
            >
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden sm:inline">Offline Nav</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500 text-white font-mono">144 Tiles</span>
            </button>
          ) : offlineTilesEnabled ? (
            <button
              id="btn-nav-offline-status"
              onClick={onOpenSetup}
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isEmergencyMode
                  ? 'bg-neutral-900 border-neutral-700 text-emerald-300 hover:bg-neutral-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Offline Map Tiles downloaded (144 vector tiles cached for zero-connectivity emergencies)"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Offline Ready</span>
            </button>
          ) : null}

          {/* Configure Setup Modal Trigger */}
          <button
            id="btn-edit-setup"
            onClick={onOpenSetup}
            className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isEmergencyMode
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200 hover:bg-neutral-800'
                : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
            }`}
            title="Configure emergency type, party members and transport"
            aria-label="Incident Profile"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>

          {/* SOS Broadcast / Share Location Button */}
          {onShareSOS && (
            <button
              id="btn-share-sos"
              onClick={onShareSOS}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isEmergencyMode
                  ? 'bg-red-950/80 border-red-500/80 text-red-200 hover:bg-red-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
              title="Broadcast Emergency SOS & Safe Route to Rescuers/Family"
              aria-label="Broadcast Emergency SOS"
            >
              <Share2 className="w-4 h-4 text-emerald-600 dark:text-red-400" />
              <span className="hidden sm:inline">SOS Broadcast</span>
            </button>
          )}

          {/* Audio Alert Toggle */}
          <button
            id="btn-toggle-audio"
            onClick={onToggleAudio}
            className={`p-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs border flex items-center justify-center transition-colors cursor-pointer ${
              isAudioEnabled
                ? isEmergencyMode
                  ? 'bg-neutral-900 border-neutral-700 text-emerald-400'
                  : 'bg-neutral-100 border-neutral-300 text-emerald-700'
                : isEmergencyMode
                ? 'bg-neutral-900 border-neutral-800 text-neutral-500'
                : 'bg-neutral-100 border-neutral-200 text-neutral-400'
            }`}
            title={isAudioEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
            aria-label="Toggle Audio Alerts"
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Mode Switch (Black vs Light) */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleEmergencyMode}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isEmergencyMode
                ? 'bg-neutral-900 border-neutral-700 text-neutral-100 hover:bg-neutral-800 hover:border-neutral-600 shadow-xs'
                : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-xs'
            }`}
            title={isEmergencyMode ? 'Current theme: Black. Click to switch to Light theme' : 'Current theme: Light. Click to switch to Black theme'}
            aria-label={isEmergencyMode ? 'Switch to Light Theme' : 'Switch to Black Theme'}
          >
            {isEmergencyMode ? (
              <>
                <Moon className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Theme: Black</span>
                <span className="sm:hidden font-extrabold">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Theme: Light</span>
                <span className="sm:hidden font-extrabold">Light</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Mobile Incident Sub-Strip (Visible strictly on phone screens < md) */}
      {/* Mobile Incident Sub-Bar (Compact) */}
      <div
        onClick={onOpenSetup}
        className={`md:hidden px-3 py-1.5 border-t text-[11px] font-medium cursor-pointer flex items-center justify-between gap-2 transition-colors active:opacity-80 ${
          isEmergencyMode
            ? 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
            : 'bg-neutral-50 border-neutral-200 text-neutral-800'
        }`}
        title="Tap to calibrate incident or acquire live GPS"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{getDisasterIcon(emergencyType)}</div>
          <div className="min-w-0 truncate">
            <span className="font-bold mr-1">{formatDisasterName(emergencyType)}</span>
            <span className="text-neutral-500 mr-1">•</span>
            <span className="text-neutral-400 truncate">
              {location}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`font-bold text-[9px] px-1.5 py-0.2 rounded-md ${
              threatLevel === 'Critical' || threatLevel === 'Severe'
                ? 'bg-red-600 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {threatLevel}
          </span>
          <span className="text-[10px] text-neutral-400 font-semibold">Change ⚙️</span>
        </div>
      </div>
    </header>
  );
};
