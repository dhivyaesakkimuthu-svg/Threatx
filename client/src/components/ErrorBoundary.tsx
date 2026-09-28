import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home, RotateCcw } from 'lucide-react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ThreatX ErrorBoundary] Uncaught React exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndLogin = () => {
    localStorage.removeItem('threatx_token');
    localStorage.removeItem('threatx_user');
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F6F8FB] text-[#172033] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E4E7EC] rounded-2xl shadow-xl p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626] mx-auto flex items-center justify-center shadow-xs">
              <ShieldAlert size={28} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#172033]">
                Console Rendering Anomaly
              </h2>
              <p className="text-xs text-[#667085] mt-1">
                The SOC interface encountered an unexpected rendering error. Your telemetry and backend security engines are unaffected.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl text-left">
                <p className="text-[11px] font-mono font-semibold text-[#DC2626] truncate">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                icon={<RefreshCw size={13} />}
                onClick={this.handleReset}
              >
                Reload Console
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={13} />}
                onClick={this.handleClearAndLogin}
              >
                Re-authenticate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Home size={13} />}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
