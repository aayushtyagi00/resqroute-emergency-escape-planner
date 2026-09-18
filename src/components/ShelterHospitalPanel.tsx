import React, { useState } from 'react';
import {
  Home,
  PlusSquare,
  Users,
  CheckCircle2,
  AlertCircle,
  Accessibility,
  HeartPulse,
  Sparkles,
  Milestone,
  Clock,
  ShieldCheck,
  Zap,
  Dog,
  Compass,
  Navigation,
  Activity,
  BedDouble,
  Shield,
  Filter,
} from 'lucide-react';
import { Hospital, Shelter } from '../types';

interface ShelterHospitalPanelProps {
  shelters: Shelter[];
  selectedShelterId: string;
  onSelectShelter: (id: string) => void;
  hospitals: Hospital[];
  isEmergencyMode: boolean;
  hasInjured: boolean;
  onFocusOnMap?: (target: { type: 'shelter' | 'hospital'; id: string; lat?: number; lng?: number; title?: string }) => void;
}

export const ShelterHospitalPanel: React.FC<ShelterHospitalPanelProps> = ({
  shelters,
  selectedShelterId,
  onSelectShelter,
  hospitals,
  isEmergencyMode,
  hasInjured,
  onFocusOnMap,
}) => {
  const [filter, setFilter] = useState<'all' | 'ada' | 'pet' | 'generator'>('all');

  const filteredShelters = shelters.filter((s) => {
    if (filter === 'ada') return s.wheelchairAccessible;
    if (filter === 'pet') return s.petFriendly ?? true;
    if (filter === 'generator') return s.backupGenerator ?? true;
    return true;
  });

  return (
    <div id="shelters-hospitals-section" className="space-y-6">
      {/* 1. Sub-Header Summary Ribbon */}
      <div
        className={`rounded-2xl p-4 border flex items-center justify-between gap-4 flex-wrap ${
          isEmergencyMode
            ? 'bg-neutral-900/90 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Active Safe Haven & Triage Network</h2>
            <p className="text-xs text-neutral-400">
              Live capacity monitoring, generator readiness, and priority medical routing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-400">Shelters Online:</span>
            <strong className="text-white font-mono-data">
              {shelters.filter((s) => s.status !== 'Full').length}/{shelters.length} Available
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-neutral-400">Hospitals Linked:</span>
            <strong className="text-white font-mono-data">{hospitals.length} Triage Bays</strong>
          </div>
        </div>
      </div>

      {/* 2. Shelters Section */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-colors ${
          isEmergencyMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Designated Emergency Shelters</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Verified relief zones evaluated by live capacity, generator status, and rations.
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-400 mr-1" />
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All ({shelters.length})
            </button>
            <button
              onClick={() => setFilter('ada')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                filter === 'ada'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Accessibility className="w-3 h-3" />
              ADA Only
            </button>
            <button
              onClick={() => setFilter('pet')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                filter === 'pet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Dog className="w-3 h-3" />
              Pet Friendly
            </button>
            <button
              onClick={() => setFilter('generator')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                filter === 'generator'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              Generator 100%
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredShelters.map((shelter) => {
            const isSelected = shelter.id === selectedShelterId;
            const occupancyPct = Math.round((shelter.capacityOccupied / shelter.capacityTotal) * 100);
            const isFull = shelter.status === 'Full';
            const bedsRemaining = shelter.capacityTotal - shelter.capacityOccupied;

            return (
              <div
                key={shelter.id}
                onClick={() => onSelectShelter(shelter.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20 shadow-md'
                    : isFull
                    ? 'border-red-300 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 opacity-80'
                    : isEmergencyMode
                    ? 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60'
                    : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                    ACTIVE DESTINATION
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold leading-tight">{shelter.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 font-mono-data ${
                        isFull
                          ? 'bg-red-600 text-white'
                          : occupancyPct > 85
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {isFull ? 'CRITICAL FULL' : `${occupancyPct}% FULL`}
                    </span>
                  </div>

                  {/* Distance & Time */}
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-200 font-mono-data">
                      <Milestone className="w-3.5 h-3.5 text-emerald-400" /> {shelter.distanceKm} km
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono-data">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" /> {shelter.timeMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="text-[11px] font-medium">{shelter.type}</span>
                  </div>

                  {/* Occupancy bar with beds remaining callout */}
                  <div className="mb-3.5 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-neutral-500 dark:text-neutral-400">Available Cots</span>
                      <span className="font-bold text-emerald-400 font-mono-data">
                        {isFull ? '0 Beds' : `${bedsRemaining} beds free`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? 'bg-red-600'
                            : occupancyPct > 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancyPct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between font-mono-data">
                      <span>Occupied: {shelter.capacityOccupied}</span>
                      <span>Total: {shelter.capacityTotal}</span>
                    </div>
                  </div>

                  {/* Key features badges */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] mb-2">
                    {shelter.hasMedicalPost && (
                      <span className="bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                        <HeartPulse className="w-3 h-3" /> Medical Bay
                      </span>
                    )}
                    {shelter.wheelchairAccessible && (
                      <span className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                        <Accessibility className="w-3 h-3" /> ADA Ramp
                      </span>
                    )}
                    <span className="bg-neutral-800/80 text-neutral-300 px-2 py-0.5 rounded-md font-medium">
                      {shelter.foodSuppliesDays}d Food Ration
                    </span>
                    <span className="bg-purple-950/80 border border-purple-800/60 text-purple-300 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Generator 100%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => onSelectShelter(shelter.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                        : isFull
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                    }`}
                    disabled={isFull}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Target Safe Haven Active</span>
                      </>
                    ) : isFull ? (
                      <span>Capacity Exhausted</span>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Select Safe Haven</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectShelter(shelter.id);
                      onFocusOnMap?.({
                        type: 'shelter',
                        id: shelter.id,
                        lat: shelter.coordinates?.lat,
                        lng: shelter.coordinates?.lng,
                        title: shelter.name,
                      });
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="Focus and view this shelter on tactical map"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View on Map</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Hospitals & Medical Triage Section */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-colors ${
          isEmergencyMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center font-bold">
              <PlusSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Tactical Medical & Triage Directory</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Direct emergency triage routes with live ICU bed capacity and burn/trauma units.
              </p>
            </div>
          </div>

          {hasInjured && (
            <span className="text-[11px] font-bold text-red-200 bg-red-950/80 border border-red-700/80 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <HeartPulse className="w-3.5 h-3.5 text-red-400" />
              Injured Evacuee Medevac Priority Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">{hosp.name}</h4>
                    <span className="text-xs text-neutral-400">Casualty Clearing Station</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/80 font-mono-data">
                    {hosp.traumaLevel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase font-medium">
                      Distance
                    </span>
                    <span className="font-bold font-mono-data text-white">{hosp.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase font-medium">
                      Ambulance ETA
                    </span>
                    <span className="font-bold font-mono-data text-cyan-400">{hosp.timeMinutes} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block uppercase font-medium">
                      ICU Beds
                    </span>
                    <span className="font-bold text-emerald-400 font-mono-data">
                      {hosp.icuBedsAvailable} Open
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Ambulance Access: <strong className="text-white">{hosp.ambulanceAccess}</strong>
                  </span>
                  <span className="text-emerald-400 font-semibold font-mono-data">
                    ● {hosp.emergencyStatus}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onFocusOnMap?.({
                      type: 'hospital',
                      id: hosp.id,
                      lat: hosp.coordinates?.lat,
                      lng: hosp.coordinates?.lng,
                      title: hosp.name,
                    });
                  }}
                  className="mt-3 w-full py-2 rounded-xl text-xs font-bold bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/40 text-cyan-300 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  title="Locate this medical facility on tactical map"
                >
                  <PlusSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pinpoint Medical Facility on Map &rarr;</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
