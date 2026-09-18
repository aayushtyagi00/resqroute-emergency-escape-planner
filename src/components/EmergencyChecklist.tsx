import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Briefcase,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { DisasterType, VulnerabilityFlags } from '../types';

interface EmergencyChecklistProps {
  disasterType: DisasterType;
  vulnerabilities: VulnerabilityFlags;
  peopleCount: number;
  isEmergencyMode: boolean;
}

interface Item {
  id: string;
  category: 'Essentials' | 'Disaster Gear' | 'Medical & Vulnerable' | 'Documents';
  text: string;
  critical: boolean;
}

export const EmergencyChecklist: React.FC<EmergencyChecklistProps> = ({
  disasterType,
  vulnerabilities,
  peopleCount,
  isEmergencyMode,
}) => {
  // Generate items dynamically
  const initialItems: Item[] = useMemo(() => {
    const list: Item[] = [
      {
        id: 'water',
        category: 'Essentials',
        text: `Drinking Water (${Math.max(4, peopleCount * 2)} Liters sealed in bottles)`,
        critical: true,
      },
      {
        id: 'food',
        category: 'Essentials',
        text: 'Non-perishable energy bars & ready-to-eat rations (3 days)',
        critical: true,
      },
      {
        id: 'power',
        category: 'Essentials',
        text: 'Fully charged Power Bank (10,000+ mAh) & mobile charging cables',
        critical: true,
      },
      {
        id: 'torch',
        category: 'Essentials',
        text: 'LED Torch / Headlamp with spare batteries & emergency whistle',
        critical: true,
      },
      {
        id: 'docs',
        category: 'Documents',
        text: 'Original ID Cards (Aadhaar/Passports) sealed in waterproof ziplock pouch',
        critical: true,
      },
      {
        id: 'cash',
        category: 'Documents',
        text: 'Emergency cash in small denominations (ATMs/digital pay will be down)',
        critical: false,
      },
    ];

    // Disaster-specific items
    if (disasterType === 'flash_flood') {
      list.push(
        {
          id: 'dry-bag',
          category: 'Disaster Gear',
          text: 'Heavy-duty waterproof dry bags for electronics & valuables',
          critical: true,
        },
        {
          id: 'rain-poncho',
          category: 'Disaster Gear',
          text: 'Reflective rain ponchos & waterproof traction footwear',
          critical: true,
        },
        {
          id: 'rope',
          category: 'Disaster Gear',
          text: 'High-tensile nylon evacuation rope (10 meters) & safety carabiner',
          critical: false,
        }
      );
    } else if (disasterType === 'wildfire') {
      list.push(
        {
          id: 'mask',
          category: 'Disaster Gear',
          text: 'N95 / FFP2 particulate smoke respirator masks for all members',
          critical: true,
        },
        {
          id: 'goggles',
          category: 'Disaster Gear',
          text: 'Eye protection goggles & damp cotton bandanas for smoke barrier',
          critical: true,
        },
        {
          id: 'blanket',
          category: 'Disaster Gear',
          text: 'Heavy wool or fire-retardant safety blanket',
          critical: false,
        }
      );
    } else if (disasterType === 'landslide') {
      list.push(
        {
          id: 'boots',
          category: 'Disaster Gear',
          text: 'Sturdy high-ankle trekking boots with mud grip soles',
          critical: true,
        },
        {
          id: 'helmet',
          category: 'Disaster Gear',
          text: 'Hard hats / helmets for falling rock protection',
          critical: true,
        }
      );
    } else if (disasterType === 'earthquake') {
      list.push(
        {
          id: 'gloves',
          category: 'Disaster Gear',
          text: 'Heavy-duty leather work gloves to clear rubble safely',
          critical: true,
        },
        {
          id: 'first-aid',
          category: 'Disaster Gear',
          text: 'Splints, triangular bandages & trauma dressings',
          critical: true,
        }
      );
    } else if (disasterType === 'accident') {
      list.push(
        {
          id: 'hazard-triangle',
          category: 'Disaster Gear',
          text: 'Reflective high-visibility hazard vest & folding warning triangle',
          critical: true,
        },
        {
          id: 'window-punch',
          category: 'Disaster Gear',
          text: 'Emergency glass window punch & seatbelt cutter rescue tool',
          critical: true,
        },
        {
          id: 'hemostatic-gauze',
          category: 'Disaster Gear',
          text: 'Hemostatic trauma compression gauze & burn gel dressing',
          critical: true,
        }
      );
    }

    // Vulnerability-specific items
    if (vulnerabilities.elderly) {
      list.push(
        {
          id: 'elderly-meds',
          category: 'Medical & Vulnerable',
          text: 'Elderly: 10-day supply of chronic prescription medicines (BP, Diabetes, Heart)',
          critical: true,
        },
        {
          id: 'elderly-mobility',
          category: 'Medical & Vulnerable',
          text: 'Elderly: Walking cane / folding walker & spare prescription eyeglasses',
          critical: true,
        }
      );
    }

    if (vulnerabilities.children) {
      list.push(
        {
          id: 'child-nutrition',
          category: 'Medical & Vulnerable',
          text: 'Children: Infant formula, sterile bottles, diapers & favorite comforting item',
          critical: true,
        },
        {
          id: 'child-tag',
          category: 'Medical & Vulnerable',
          text: 'Children: Emergency ID wristband / card with parent contact numbers',
          critical: true,
        }
      );
    }

    if (vulnerabilities.injured) {
      list.push(
        {
          id: 'trauma-pack',
          category: 'Medical & Vulnerable',
          text: 'Injured: Sterile gauze pads, antiseptic wash, adhesive sutures & analgesics',
          critical: true,
        },
        {
          id: 'tourniquet',
          category: 'Medical & Vulnerable',
          text: 'Injured: Emergency pressure bandage and limb immobilization splint',
          critical: true,
        }
      );
    }

    if (vulnerabilities.disabled) {
      list.push({
        id: 'disabled-assist',
        category: 'Medical & Vulnerable',
        text: 'Mobility Assist: Wheelchair manual locks, transfer strap & medical condition summary',
        critical: true,
      });
    }

    return list;
  }, [disasterType, vulnerabilities, peopleCount]);

  // Persist checked items to local storage so emergency prep is preserved across reloads
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('resqroute_checklist_state_v1');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      water: true,
      power: true,
      docs: true,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('resqroute_checklist_state_v1', JSON.stringify(checkedState));
    } catch {}
  }, [checkedState]);

  const toggleItem = (id: string) => {
    setCheckedState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalCount = initialItems.length;
  const packedCount = initialItems.filter((item) => checkedState[item.id]).length;
  const progressPct = Math.round((packedCount / totalCount) * 100);

  const handleExportChecklist = () => {
    const textContent = `RESQROUTE EMERGENCY SURVIVAL CHECKLIST
Disaster: ${disasterType.toUpperCase()}
Evacuation Party Size: ${peopleCount}
Vulnerabilities: ${Object.entries(vulnerabilities).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}

PACKED STATUS: ${packedCount}/${totalCount} items (${progressPct}%)
Generated: ${new Date().toLocaleString()}

========================================
${initialItems
  .map(
    (item) =>
      `[${checkedState[item.id] ? 'X' : ' '}] ${item.category.toUpperCase()} - ${item.text} ${
        item.critical ? '*(CRITICAL)*' : ''
      }`
  )
  .join('\n')}
========================================
Emergency Helplines:
- National Disaster Response (NDRF): 1078 / 112
- State Emergency Operations Centre: 1070
- Ambulance Emergency: 108 / 102
`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ResQRoute_Evacuation_Checklist_${disasterType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="emergency-checklist-card"
      className={`rounded-2xl p-5 border shadow-sm transition-colors ${
        isEmergencyMode
          ? 'bg-neutral-900 border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Adaptive Evacuation Survival Kit</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Dynamically synthesized for {disasterType.replace('_', ' ')} and your exact group profile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportChecklist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition cursor-pointer"
            title="Download offline evacuation checklist"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Offline Kit</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Evacuation Readiness: {packedCount} of {totalCount} items secured
          </span>
          <span className={progressPct === 100 ? 'text-emerald-600 font-bold' : 'text-neutral-500'}>
            {progressPct}% READY
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct === 100 ? 'bg-emerald-500' : progressPct > 60 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {initialItems.map((item) => {
          const isChecked = !!checkedState[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                isChecked
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-neutral-900 dark:text-white'
                  : 'bg-white dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
              }`}
            >
              <div className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-neutral-400" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                    {item.category}
                  </span>
                  {item.critical && (
                    <span className="text-[9px] font-bold text-red-600 dark:text-red-400">
                      CRITICAL
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isChecked ? 'line-through text-neutral-400 dark:text-neutral-500' : ''}`}>
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
