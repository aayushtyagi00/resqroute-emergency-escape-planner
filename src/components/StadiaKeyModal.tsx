import React from 'react';
import {
  Layers,
  X,
  CheckCircle2,
  Sparkles,
  Map,
} from 'lucide-react';
import {
  StadiaMapStyle,
  STADIA_STYLE_OPTIONS,
} from '../utils/stadiaMaps';

interface StadiaKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStyle: StadiaMapStyle;
  onChangeStyle: (style: StadiaMapStyle) => void;
  onKeyUpdated?: () => void;
  isEmergencyMode: boolean;
}

export const StadiaKeyModal: React.FC<StadiaKeyModalProps> = ({
  isOpen,
  onClose,
  currentStyle,
  onChangeStyle,
  isEmergencyMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all ${
          isEmergencyMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Map Style & Cartography</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono-data bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  HD Real-Time
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose high-resolution satellite imagery, topographic terrain, or tactical crisis contrast.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cartography Style Selector */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              Select Active Map Theme
            </label>
            <span className="text-[10px] text-neutral-400 font-normal">
              4 tactical layers available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {STADIA_STYLE_OPTIONS.map((opt) => {
              const isSelected = currentStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeStyle(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/30 text-white shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        {opt.label}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      {opt.badge}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-[11px]">
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time vector & terrain rendering</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
