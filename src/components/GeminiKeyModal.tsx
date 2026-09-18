import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Activity,
  MessageSquare,
  Lock,
} from 'lucide-react';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmergencyMode: boolean;
  isConfigured: boolean;
  currentModel: string;
  onKeyUpdated: () => void;
}

export const GeminiKeyModal: React.FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  isEmergencyMode,
  isConfigured,
  currentModel: _currentModel,
  onKeyUpdated,
}) => {
  const selectedModel = 'gemini-3.6-flash';
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndApply = async () => {
    setIsValidating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.6-flash',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({
          type: 'success',
          text: data.message || 'Gemini 3.6 Flash Engine successfully verified and active!',
        });
        onKeyUpdated();
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to verify Gemini 3.6 Flash API connectivity with local server .env.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network communication failure with local server.',
      });
    } finally {
      setIsValidating(false);
    }
  };

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
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">Google Gemini AI Engine</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono-data border ${
                    isConfigured
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {isConfigured ? 'Live Connected (.env)' : 'Autonomous Engine'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Real-time multimodal disaster routing, chokepoint analysis & conversational advisor.
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

        {/* Current Connection Status Box */}
        <div className="mb-4">
          {isConfigured ? (
            <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-300">
                    Gemini 3.6 Flash Active & Verified
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Configured securely via server environment (<code className="text-emerald-400 font-mono">.env</code>). API keys are protected on the backend and never exposed to the client.
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Lock className="w-3 h-3" /> Protected
                    </span>
                    <span>•</span>
                    <span>Model: <strong className="text-white font-mono">{selectedModel}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300">
                <span className="font-bold text-amber-300">Autonomous Rule Engine Active:</span> To enable real-time Gemini AI scoring, place <code className="text-amber-300 font-mono">GEMINI_API_KEY</code> in your project's <code className="text-amber-300 font-mono">.env</code> file.
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border border-red-500/50 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Designated Model Architecture */}
        <div className="space-y-2 mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Designated Model Architecture
          </label>
          <div className="p-3.5 rounded-2xl border border-emerald-500/50 bg-emerald-950/40 text-white">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">Google Gemini 3.6 Flash</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
                Strict Active Model
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Strictly designated for all life-critical evacuation operations. Provides low-latency multimodal reasoning, real-time chokepoint threat modeling, and high-precision route safety analysis.
            </p>
          </div>
        </div>

        {/* Live Features Enabled Card */}
        <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 mb-5 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
            Real-Time Engine Capabilities
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Dynamic AI Route Scoring</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
              <Activity className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px]">Chokepoint Hazard Reasoning</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-[11px]">Tactical Evacuation Chat</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Server-side Environment Verification</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleTestAndApply}
              disabled={isValidating || !isConfigured}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pinging Gemini 3.6 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
