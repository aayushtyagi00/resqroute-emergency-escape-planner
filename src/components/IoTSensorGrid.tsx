import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Activity,
  Droplets,
  CloudRain,
  Mountain,
  HardHat,
  MapPin,
} from 'lucide-react';
import { IoTSensor } from '../types';

interface IoTSensorGridProps {
  sensors: IoTSensor[];
  evacuationWindowMinutes: number;
  isEmergencyMode: boolean;
  onFocusOnMap?: (target: {
    type: 'sensor';
    id: string;
    lat?: number;
    lng?: number;
    title?: string;
  }) => void;
}

export const IoTSensorGrid: React.FC<IoTSensorGridProps> = ({
  sensors,
  evacuationWindowMinutes,
  isEmergencyMode,
  onFocusOnMap,
}) => {
  // Anchor countdown to wall-clock deadline timestamp so tab navigation preserves elapsed time
  const [secondsLeft, setSecondsLeft] = useState(evacuationWindowMinutes * 60);
  const deadlineRef = useRef<number>(Date.now() + evacuationWindowMinutes * 60 * 1000);

  useEffect(() => {
    deadlineRef.current = Date.now() + evacuationWindowMinutes * 60 * 1000;
    setSecondsLeft(evacuationWindowMinutes * 60);
  }, [evacuationWindowMinutes]);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'water_level':
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case 'rainfall':
        return <CloudRain className="w-4 h-4 text-cyan-500" />;
      case 'landslide_tilt':
        return <Mountain className="w-4 h-4 text-amber-500" />;
      case 'bridge_stress':
        return <HardHat className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div
      id="iot-telemetry-card"
      className={`rounded-2xl p-5 border shadow-sm transition-colors ${
        isEmergencyMode
          ? 'bg-neutral-900 border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Simulated IoT Sensor Grid & Telemetry</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                4 STATIONS ACTIVE
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Live automated environmental feeds transmitting road safety thresholds to the routing engine.
            </p>
          </div>
        </div>

        {/* Evacuation Window Countdown */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300">
          <Clock className="w-4 h-4 text-red-600 animate-pulse shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block">Estimated Safe Evac Window</span>
            <span className="font-mono text-base font-extrabold tracking-tight">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {sensors.map((sensor) => {
          const isCritical = sensor.status === 'critical';
          const isWarning = sensor.status === 'warning';

          return (
            <div
              key={sensor.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                isCritical
                  ? 'bg-red-50/60 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                  : isWarning
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {getSensorIcon(sensor.type)}
                    <span className="truncate max-w-[130px]">{sensor.name.split('(')[0]}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      isCritical
                        ? 'bg-red-600 text-white animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {sensor.status}
                  </span>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold tracking-tight">
                      {sensor.value}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {sensor.unit}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">
                    Threshold: {sensor.threshold} {sensor.unit}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between text-[10px]">
                <span className="text-neutral-500 dark:text-neutral-400 truncate max-w-[100px]">
                  {sensor.location}
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  {sensor.trend === 'rising' ? (
                    <span className="text-red-500 flex items-center">
                      <TrendingUp className="w-3 h-3" /> Rising
                    </span>
                  ) : sensor.trend === 'falling' ? (
                    <span className="text-emerald-500 flex items-center">
                      <TrendingDown className="w-3 h-3" /> Falling
                    </span>
                  ) : (
                    <span className="text-neutral-400 flex items-center">
                      <Minus className="w-3 h-3" /> Stable
                    </span>
                  )}
                </span>
              </div>

              {onFocusOnMap && sensor.coordinates && (
                <button
                  type="button"
                  onClick={() =>
                    onFocusOnMap({
                      type: 'sensor',
                      id: sensor.id,
                      lat: sensor.coordinates?.lat,
                      lng: sensor.coordinates?.lng,
                      title: sensor.name,
                    })
                  }
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-white/80 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-neutral-700 dark:text-neutral-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Pinpoint on Map</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
