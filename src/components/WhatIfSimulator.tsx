import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  CloudRain,
  Building2,
  UserPlus,
  Clock,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { RouteOption, WhatIfScenario } from '../types';

interface WhatIfSimulatorProps {
  scenario: WhatIfScenario;
  onChangeScenario: (updater: (prev: WhatIfScenario) => WhatIfScenario) => void;
  routes: RouteOption[];
  recommendedRoute: RouteOption;
  onReset: () => void;
  isEmergencyMode: boolean;
  onTriggerSound: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  scenario,
  onChangeScenario,
  routes,
  recommendedRoute,
  onReset,
  isEmergencyMode,
  onTriggerSound,
}) => {
  const toggleRoadA = () => {
    onTriggerSound();
    onChangeScenario((prev) => ({ ...prev, roadABlocked: !prev.roadABlocked }));
  };

  const toggleRainSurge = () => {
    onTriggerSound();
    onChangeScenario((prev) => ({ ...prev, heavyRainSurge: !prev.heavyRainSurge }));
  };

  const toggleShelterFull = () => {
    onTriggerSound();
    onChangeScenario((prev) => ({ ...prev, shelterAlphaFull: !prev.shelterAlphaFull }));
  };

  const toggleInjured = () => {
    onTriggerSound();
    onChangeScenario((prev) => ({ ...prev, injuredPersonAdded: !prev.injuredPersonAdded }));
  };

  const setDelay = (mins: number) => {
    onTriggerSound();
    onChangeScenario((prev) => ({ ...prev, evacuationDelayMinutes: mins }));
  };

  const isAnyActive =
    scenario.roadABlocked ||
    scenario.heavyRainSurge ||
    scenario.shelterAlphaFull ||
    scenario.injuredPersonAdded ||
    scenario.evacuationDelayMinutes > 0;

  return (
    <div
      id="what-if-simulator-card"
      className={`rounded-2xl p-5 border shadow-sm transition-colors ${
        isEmergencyMode
          ? 'bg-neutral-900 border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">What-If Disaster Simulator</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                Hackathon Demo Engine
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Stress-test navigation priorities by simulating sudden emergency events in real time.
            </p>
          </div>
        </div>

        {isAnyActive && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        )}
      </div>

      {/* Interactive Scenario Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Scenario 1: Road Blocked */}
        <button
          onClick={toggleRoadA}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            scenario.roadABlocked
              ? 'bg-red-50 dark:bg-red-950/70 border-red-400 dark:border-red-600 ring-2 ring-red-400/40'
              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <AlertOctagon className={`w-4 h-4 ${scenario.roadABlocked ? 'text-red-600' : 'text-neutral-500'}`} />
              <span className={scenario.roadABlocked ? 'text-red-900 dark:text-red-200' : ''}>
                Road A Blocked?
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                scenario.roadABlocked
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {scenario.roadABlocked ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
            Simulates Bridge 2 flooding & impassability. System automatically routes to Ridge Bypass.
          </p>
        </button>

        {/* Scenario 2: Rainfall Surge */}
        <button
          onClick={toggleRainSurge}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            scenario.heavyRainSurge
              ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/40'
              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <CloudRain className={`w-4 h-4 ${scenario.heavyRainSurge ? 'text-blue-600' : 'text-neutral-500'}`} />
              <span className={scenario.heavyRainSurge ? 'text-blue-900 dark:text-blue-200' : ''}>
                Rainfall Surges (84mm)?
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                scenario.heavyRainSurge
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {scenario.heavyRainSurge ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
            Flood zones expand, river water level hits 88cm. Route A score drops from 55 to 15.
          </p>
        </button>

        {/* Scenario 3: Shelter Full */}
        <button
          onClick={toggleShelterFull}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            scenario.shelterAlphaFull
              ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/40'
              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Building2 className={`w-4 h-4 ${scenario.shelterAlphaFull ? 'text-amber-600' : 'text-neutral-500'}`} />
              <span className={scenario.shelterAlphaFull ? 'text-amber-900 dark:text-amber-200' : ''}>
                Shelter Full (100%)?
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                scenario.shelterAlphaFull
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {scenario.shelterAlphaFull ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
            Nearest shelter reaches max capacity. System dynamically reallocates to High Ridge Center.
          </p>
        </button>

        {/* Scenario 4: Injured Person */}
        <button
          onClick={toggleInjured}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            scenario.injuredPersonAdded
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/40'
              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <UserPlus className={`w-4 h-4 ${scenario.injuredPersonAdded ? 'text-emerald-600' : 'text-neutral-500'}`} />
              <span className={scenario.injuredPersonAdded ? 'text-emerald-900 dark:text-emerald-200' : ''}>
                Injured Evacuee Added?
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                scenario.injuredPersonAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {scenario.injuredPersonAdded ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
            Hospital proximity weight surges. Prioritizes Route C Highway direct to Solan Trauma Center.
          </p>
        </button>
      </div>

      {/* Evacuation Timing Delay Slider */}
      <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <div>
            <div className="text-xs font-bold">Simulate Evacuation Departure Delay</div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Delaying departure closes the safe evacuation window as water/hazard expands.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {[0, 15, 30, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => setDelay(mins)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                scenario.evacuationDelayMinutes === mins
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {mins === 0 ? 'Immediate' : `+${mins} min`}
            </button>
          ))}
        </div>
      </div>

      {/* Active System Response Summary */}
      {isAnyActive && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Real-time Recalculation Active: </span>
              <span>
                Engine recommended <strong>{recommendedRoute.name}</strong> (Safety Score: {recommendedRoute.safetyScore}/100)
              </span>
            </div>
          </div>
          <div className="text-[11px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded">
            Optimized
          </div>
        </div>
      )}
    </div>
  );
};
