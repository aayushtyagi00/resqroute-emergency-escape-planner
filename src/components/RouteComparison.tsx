import React from 'react';
import {
  Shield,
  Zap,
  Accessibility,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Milestone,
  ArrowUpRight,
  TrendingDown,
  Info,
  MapPin,
} from 'lucide-react';
import { RouteOption } from '../types';

interface RouteComparisonProps {
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  isEmergencyMode: boolean;
  onFocusOnMap?: (target: {
    type: 'route';
    id: string;
    title?: string;
  }) => void;
}

export const RouteComparison: React.FC<RouteComparisonProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isEmergencyMode,
  onFocusOnMap,
}) => {
  const getScoreBadge = (score: number, status: string) => {
    if (status === 'blocked') {
      return (
        <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
          BLOCKED (0/100)
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Shield className="w-3 h-3" />
          {score}/100 • VERY SAFE
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="bg-amber-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Info className="w-3 h-3" />
          {score}/100 • MODERATE
        </span>
      );
    }
    return (
      <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {score}/100 • RISKY
      </span>
    );
  };

  const getCardHeader = (tag: string) => {
    switch (tag) {
      case 'safest':
        return {
          title: 'SAFEST ROUTE (RECOMMENDED)',
          icon: <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          accentBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60',
          badge: 'High Survival Probability',
        };
      case 'fastest':
        return {
          title: 'FASTEST ROUTE',
          icon: <Zap className="w-4 h-4 text-amber-500" />,
          accentBg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
          badge: 'Speed Over Hazard Margin',
        };
      case 'accessible':
        return {
          title: 'HIGH ACCESSIBILITY ROUTE',
          icon: <Accessibility className="w-4 h-4 text-cyan-500" />,
          accentBg: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800',
          badge: 'Elderly / Medical Priority',
        };
      default:
        return {
          title: 'ALTERNATE ROUTE',
          icon: <ArrowUpRight className="w-4 h-4 text-neutral-500" />,
          accentBg: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
          badge: 'Contingency Corridor',
        };
    }
  };

  return (
    <div id="route-comparison-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-lg font-bold tracking-tight ${
              isEmergencyMode ? 'text-white' : 'text-neutral-900'
            }`}
          >
            Personalized Route Decision Analysis
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Multi-criteria algorithmic evaluation comparing safety, distance, flood risk, and physical vulnerability.
          </p>
        </div>
      </div>

      {/* 3 Comparative Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const isBlocked = route.status === 'blocked';
          const header = getCardHeader(route.tag);

          return (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route.id)}
              className={`rounded-2xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between relative ${
                isBlocked
                  ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-90'
                  : isSelected
                  ? `${header.accentBg} ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md`
                  : isEmergencyMode
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-white'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-900'
              }`}
            >
              {/* Selected Pill */}
              {isSelected && (
                <div className="absolute -top-2.5 right-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                  ACTIVE ON MAP
                </div>
              )}

              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {header.icon}
                    <span>{header.title}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm tracking-tight">{route.name.split('—')[0]}</h3>
                    {getScoreBadge(route.safetyScore, route.status)}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug">
                    {route.name.split('—')[1] || route.name}
                  </p>
                </div>

                {/* Primary Metrics: Distance & ETA */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Milestone className="w-3.5 h-3.5 text-neutral-500" />
                    <div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Distance</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{route.distanceKm} km</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <div>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">Estimated Time</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{route.timeMinutes} mins</span>
                    </div>
                  </div>
                </div>

                {/* Key Risk Factors */}
                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400">Flood Hazard Exposure:</span>
                    <span
                      className={`font-semibold ${
                        route.floodRisk === 'Severe' || route.floodRisk === 'High'
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {route.floodRisk}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400">Road Surface:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {route.roadCondition}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-neutral-500 dark:text-neutral-400">Incline Gradient:</span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {route.gradient}
                    </span>
                  </div>
                </div>

                {/* Safety Score Meter Visualizer */}
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] mb-1 font-semibold">
                    <span className="text-neutral-600 dark:text-neutral-300">Composite Safety Score</span>
                    <span>{route.safetyScore}/100</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        route.safetyScore >= 80
                          ? 'bg-emerald-500'
                          : route.safetyScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${route.safetyScore}%` }}
                    />
                  </div>
                </div>

                {/* Key Benefits or Blocked Alert */}
                {isBlocked ? (
                  <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-700 text-red-900 dark:text-red-200 text-xs">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>{route.blockedReason}</span>
                    </div>
                    <p className="text-[11px] opacity-90">Avoid this route under all circumstances.</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-[11px]">
                    {route.benefits.slice(0, 2).map((b, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-neutral-600 dark:text-neutral-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                    {route.cautions.length > 0 && (
                      <div className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400 mt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{route.cautions[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => onSelectRoute(route.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Selected Path</span>
                    </>
                  ) : (
                    <span>Select Route</span>
                  )}
                </button>

                {onFocusOnMap && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRoute(route.id);
                      onFocusOnMap({
                        type: 'route',
                        id: route.id,
                        title: route.name,
                      });
                    }}
                    title="View & Trace on Interactive Map"
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Trace on Map</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
