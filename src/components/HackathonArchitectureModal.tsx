import React from 'react';
import {
  X,
  GraduationCap,
  Dna,
  Building,
  Code2,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Layers,
} from 'lucide-react';

interface HackathonArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmergencyMode: boolean;
}

export const HackathonArchitectureModal: React.FC<HackathonArchitectureModalProps> = ({
  isOpen,
  onClose,
  isEmergencyMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-3xl rounded-t-3xl sm:rounded-2xl border-t sm:border p-4 sm:p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto ${
          isEmergencyMode
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight truncate">
                ResQRoute — System Model
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                Bioinformatics, Civil, CS & IoT Blueprint.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer shrink-0"
            aria-label="Close architecture modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Core Pitch Banner */}
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 mb-5">
          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider block mb-1">
            CORE VALUE PROPOSITION & USP
          </span>
          <blockquote className="text-sm font-semibold text-indigo-950 dark:text-indigo-100 italic">
            “Most navigation apps find the fastest route. ResQRoute finds the safest route when the city is in danger.”
          </blockquote>
          <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1">
            ResQRoute doesn&apos;t just tell people where to go — it dynamically decides where they should go based on environmental disaster progression, shelter saturation, and human physiological vulnerability.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Pillar 1: Bioinformatics */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-purple-700 dark:text-purple-400">
              <Dna className="w-4 h-4" />
              <span>1. Bioinformatics & Personalized Risk Modeling</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Standard evac planners treat humans as identical point particles. ResQRoute introduces a <strong>Human Vulnerability Index</strong>:
            </p>
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-purple-900 dark:text-purple-200">
              Vulnerability Score V = ∑ (w_age · A_i + w_mobility · M_i + w_injury · I_i)
            </div>
            <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
              <li>• <strong>Elderly:</strong> Penalizes slope grades &gt;8% and unpaved terrain by 3.5x.</li>
              <li>• <strong>Injured:</strong> Maximizes proximity to emergency Level 1 Trauma ICU.</li>
              <li>• <strong>Children:</strong> Prioritizes rapid convergence to low-panic designated shelters.</li>
            </ul>
          </div>

          {/* Pillar 2: Civil Engineering */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-700 dark:text-amber-400">
              <Building className="w-4 h-4" />
              <span>2. Civil & Infrastructure Engineering</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Road networks are scored with geotechnical and hydraulic criteria:
            </p>
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-amber-900 dark:text-amber-200">
              Road Risk R_road = f(Elevation, Pavement Quality, Bridge Structural Load)
            </div>
            <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
              <li>• <strong>Flood Plain Elevation:</strong> Tracks vertical clearance above riverbeds (e.g. +220m ridge).</li>
              <li>• <strong>Bridge Load Limits:</strong> Bridges with water accumulation &gt;60cm are flagged impassable.</li>
              <li>• <strong>Landslide Slope Saturation:</strong> Hill cuts above 4.8° inclination marked as caution.</li>
            </ul>
          </div>

          {/* Pillar 3: Computer Science */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-700 dark:text-emerald-400">
              <Code2 className="w-4 h-4" />
              <span>3. Computer Science & Graph Algorithms</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Replaces conventional Shortest Path with <strong>Multi-Objective Dijkstra & A*</strong> on a weighted graph G = (V, E):
            </p>
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-emerald-900 dark:text-emerald-200">
              Edge Cost = w_d·D + w_t·T + w_hazard·R_disaster + w_road·R_road + P_vuln
            </div>
            <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
              <li>• <strong>Dynamic Re-routing:</strong> Recomputes in &lt;15ms upon road obstacle injection.</li>
              <li>• <strong>Normalized 0-100 Score:</strong> Instant intuitive safety grading for citizens and rescuers.</li>
            </ul>
          </div>

          {/* Pillar 4: IoT & Electronics */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-400">
              <Cpu className="w-4 h-4" />
              <span>4. IoT & Sensor Fusion Telemetry</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Feeds environmental sensor streams straight into edge weights:
            </p>
            <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[11px] font-mono text-blue-900 dark:text-blue-200">
              Telemetry Stream: Ultrasonic River Gauges + Weather Radar + Inclinometers
            </div>
            <ul className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1">
              <li>• <strong>Automated Threshold Tripping:</strong> Rising river levels trigger route closures before vehicles stall.</li>
              <li>• <strong>Evacuation Window:</strong> Predictive time-to-breach countdown for early evacuation.</li>
            </ul>
          </div>
        </div>

        {/* Hackathon Prototype Note */}
        <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Hackathon Demo Note:</strong> This application demonstrates the live decision engine with simulated Solan mountain valley topography. In a civic deployment, inputs hook directly into official State Disaster Management Authority (SDMA) feeds, municipal GIS layers, and emergency responder dispatch.
          </span>
        </div>
      </div>
    </div>
  );
};
