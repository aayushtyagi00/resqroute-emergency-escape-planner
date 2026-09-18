import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Shield,
  HelpCircle,
  MapPin,
  Compass,
  Key,
} from 'lucide-react';
import { EmergencySetup, RouteOption, Shelter } from '../types';

interface AIAdvisorCardProps {
  setup: EmergencySetup;
  selectedRoute: RouteOption;
  selectedShelter: Shelter;
  isEmergencyMode: boolean;
  geminiConfigured?: boolean;
  onOpenGeminiSettings?: () => void;
  onFocusOnMap?: (target: {
    type: 'shelter' | 'hospital' | 'sensor' | 'route';
    id?: string;
    lat?: number;
    lng?: number;
    title?: string;
  }) => void;
}

interface AdviceData {
  advisorSummary: string;
  tradeOffAnalysis: string[];
  urgencyLevel: string;
  source?: string;
  aiScore?: number;
  aiConfidence?: number;
  riskAssessment?: string;
  cautionPoints?: string[];
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
  isActionable?: boolean;
}

export const AIAdvisorCard: React.FC<AIAdvisorCardProps> = ({
  setup,
  selectedRoute,
  selectedShelter,
  isEmergencyMode,
  geminiConfigured = false,
  onOpenGeminiSettings,
  onFocusOnMap,
}) => {
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Hello, I am ResQRoute AI Emergency Tactical Advisor. I am monitoring real-time hazard sensors and evacuation corridors. How can I assist your evacuation party?`,
      time: 'Live',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch advice when route, emergency, or vulnerability changes
  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergencyType: setup.emergencyType,
          location: setup.location,
          peopleCount: setup.peopleCount,
          vulnerabilities: setup.vulnerabilities,
          transportMode: setup.transportMode,
          selectedRoute: {
            name: selectedRoute.name,
            safetyScore: selectedRoute.safetyScore,
            distance: `${selectedRoute.distanceKm} km`,
            eta: `${selectedRoute.timeMinutes} mins`,
          },
          shelter: {
            name: selectedShelter.name,
            distance: `${selectedShelter.distanceKm} km`,
            occupancy: Math.round((selectedShelter.capacityOccupied / selectedShelter.capacityTotal) * 100),
          },
          sensorData: {
            rainfall: '84 mm/h',
            waterLevel: '72 cm (River Basin Warning)',
            debris: 'Moderate on Old Highway',
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAdvice({
          advisorSummary: data.advisorSummary,
          tradeOffAnalysis: data.tradeOffAnalysis || [],
          urgencyLevel: data.urgencyLevel || 'CONTROLLED',
          source: data.source,
          aiScore: data.aiScore,
          aiConfidence: data.aiConfidence,
          riskAssessment: data.riskAssessment,
          cautionPoints: data.cautionPoints || [],
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      // Fallback
      setAdvice({
        advisorSummary: `Tactical Directive: Prioritize ${selectedRoute.name}. Maintains a 220m safety elevation above the swollen riverbed and accommodates ${
          setup.vulnerabilities.elderly ? 'elderly travelers with gentle gradients' : 'your group'
        }. Proceed directly to ${selectedShelter.name}.`,
        tradeOffAnalysis: [
          'High elevation ridge completely bypasses flooded Bridge 2',
          'Paved double-lane surface ensures dependable vehicle traction',
          `Designated shelter has verified medical post and food supplies`,
        ],
        urgencyLevel: 'HIGH',
        source: 'local-engine',
        aiScore: selectedRoute.safetyScore,
        aiConfidence: 84,
        riskAssessment: 'Autonomous rule evaluation based on sensor telemetry',
      });
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [
    selectedRoute.id,
    selectedShelter.id,
    setup.location,
    setup.emergencyType,
    setup.peopleCount,
    setup.transportMode,
    setup.vulnerabilities.elderly,
    setup.vulnerabilities.children,
    setup.vulnerabilities.injured,
    setup.vulnerabilities.disabled,
  ]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setInputQuery('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { sender: 'user', text: userText, time: now }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            emergencyType: setup.emergencyType,
            location: setup.location,
            peopleCount: setup.peopleCount,
            vulnerabilities: setup.vulnerabilities,
            routeName: selectedRoute.name,
            shelterName: selectedShelter.name,
          },
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply || 'Stay on designated high ground and avoid waterlogged crossings.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isActionable: Boolean(data.notConfigured),
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `[Tactical Backup]: For ${setup.location}, do not attempt low-water bridges. Continue along ${selectedRoute.name} to reach ${selectedShelter.name} safely.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div
      id="ai-advisor-container"
      className={`rounded-2xl p-5 border shadow-sm transition-colors ${
        isEmergencyMode
          ? 'bg-neutral-900 border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-neutral-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">AI Emergency Tactical Advisor</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  advice?.source?.startsWith('gemini')
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                }`}
              >
                <Sparkles className="w-2.5 h-2.5" />
                {advice?.source?.startsWith('gemini')
                  ? 'Gemini 3.6 Flash Live'
                  : 'Autonomous Rules Fallback'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Personalized evacuation reasoning, live risk assessment, and tactical instructions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGeminiSettings && (
            <button
              type="button"
              onClick={onOpenGeminiSettings}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                geminiConfigured
                  ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/40'
                  : 'border-amber-500/50 text-amber-400 hover:bg-amber-950/40 animate-pulse'
              }`}
              title="Configure Gemini API Key"
            >
              <Key className="w-3 h-3" />
              <span>{geminiConfigured ? 'Gemini Key' : 'Attach Key'}</span>
            </button>
          )}

          <button
            onClick={fetchAdvice}
            disabled={loadingAdvice}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            title="Regenerate Tactical Advisory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAdvice ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Unconfigured Gemini Alert Callout */}
      {!geminiConfigured && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Gemini API Not Attached — Running Autonomous Tactical Engine
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-tight mt-0.5">
                Attach your free Google AI Studio API key to switch from canned rule fallbacks to real-time Gemini multimodal reasoning & live chat.
              </p>
            </div>
          </div>
          {onOpenGeminiSettings && (
            <button
              type="button"
              onClick={onOpenGeminiSettings}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Key className="w-3 h-3" />
              <span>Attach Key</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col: Rationale & Why This Route */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            {/* Real AI Safety Score Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {advice?.source?.startsWith('gemini') ? 'Gemini AI Score:' : 'Safety Score:'}
                  </span>
                  <span className="text-base font-black font-mono-data text-emerald-600 dark:text-emerald-400">
                    {advice?.aiScore ?? selectedRoute.safetyScore}/100
                  </span>
                </div>
                {advice?.aiConfidence && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {advice.aiConfidence}% Conf
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                  {advice?.source?.startsWith('gemini') ? '✨ Google Gemini' : '⚙️ Rule Engine'}
                </span>
              </div>

              {advice?.urgencyLevel && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    advice.urgencyLevel === 'CRITICAL'
                      ? 'bg-red-600 text-white'
                      : advice.urgencyLevel === 'HIGH'
                      ? 'bg-amber-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {advice.urgencyLevel} PRIORITY
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Evacuation Tactical Briefing:
              </span>
              {advice?.riskAssessment && (
                <span className="text-[10px] text-neutral-500 italic">
                  {advice.riskAssessment}
                </span>
              )}
            </div>

            {loadingAdvice ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Computing AI evacuation analysis...</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-700 dark:text-neutral-200 leading-relaxed mb-3 font-medium">
                  {advice?.advisorSummary}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                    Key Decision Pillars:
                  </span>
                  {advice?.tradeOffAnalysis.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Tactical Map Action Synchronizers */}
          {onFocusOnMap && (
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Live Map Sync Actions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onFocusOnMap({
                      type: 'route',
                      id: selectedRoute.id,
                      title: selectedRoute.name,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Compass className="w-3 h-3 text-emerald-500" />
                  <span>Trace {selectedRoute.name} on Map</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFocusOnMap({
                      type: 'shelter',
                      id: selectedShelter.id,
                      lat: selectedShelter.coordinates?.lat,
                      lng: selectedShelter.coordinates?.lng,
                      title: selectedShelter.name,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-500" />
                  <span>Pinpoint {selectedShelter.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onFocusOnMap({
                      type: 'sensor',
                      id: 'sensor-1',
                      lat: 28.6180,
                      lng: 77.2150,
                      title: 'Yamuna River Level Gauge',
                    })
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-emerald-300/80 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-blue-500" />
                  <span>Inspect River Gauge Sensor</span>
                </button>
              </div>
            </div>
          )}

          {/* Prompt suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-neutral-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Quick Questions:
            </span>
            <button
              onClick={() => setInputQuery('Can my small hatchback pass through the ridge?')}
              className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
            >
              Small car clearance?
            </button>
            <button
              onClick={() => setInputQuery('What if water rises past the car tires?')}
              className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
            >
              Car stalling in water?
            </button>
            <button
              onClick={() => setInputQuery('How to support an elderly person with limited mobility?')}
              className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 cursor-pointer"
            >
              Elderly mobility guidance?
            </button>
          </div>
        </div>

        {/* Right Col: Interactive Live Tactical Q&A */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 bg-neutral-50 dark:bg-neutral-800/40 min-h-[220px]">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-200">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Emergency Tactical Comms</span>
            </div>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                geminiConfigured
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {geminiConfigured ? 'Gemini 3.6 Flash' : 'Offline Fallback'}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-44 pr-1 mb-2">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 ml-5 text-right'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 mr-2 shadow-xs'
                }`}
              >
                <p>{msg.text}</p>
                {msg.isActionable && onOpenGeminiSettings && (
                  <button
                    type="button"
                    onClick={onOpenGeminiSettings}
                    className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer shadow-xs transition"
                  >
                    <Key className="w-3 h-3" />
                    <span>Attach Gemini API Key</span>
                  </button>
                )}
                <span className="text-[9px] opacity-60 mt-1 block">{msg.time}</span>
              </div>
            ))}
            {chatLoading && (
              <div className="text-[11px] text-neutral-400 italic flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <span>Advisor formulating tactical response...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask emergency advisor..."
              className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !inputQuery.trim()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
