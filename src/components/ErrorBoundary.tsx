import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State;
  public props: Props;
  public setState: any;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ResQRoute Uncaught Crash]:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-white mb-1 tracking-tight">
              Emergency Interface Recovered
            </h2>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              A temporary rendering glitch was safely contained by ResQRoute fail-safe protections. Your evacuation telemetry and cache remain secure.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 text-[11px] text-red-300 font-mono mb-4 break-words">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-red-600/25"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Tactical Navigation Interface</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
