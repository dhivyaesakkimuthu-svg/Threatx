import { AlertTriangle, RefreshCw, ServerOff, Terminal } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export default function ErrorState({
  title = 'Telemetry Connection Interrupted',
  message = 'Unable to establish link with ThreatX backend service or target demo server.',
  onRetry,
  isRetrying = false,
}: ErrorStateProps) {
  return (
    <div className="min-h-[360px] w-full flex flex-col items-center justify-center p-8 rounded-xl bg-white border border-red-200 animate-fade-in text-center shadow-xs">
      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 mb-4">
        <ServerOff size={28} />
      </div>

      <h3 className="text-base font-bold text-[#172033] tracking-wide mb-1 flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-600" />
        {title}
      </h3>
      <p className="text-xs text-[#667085] max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          <span>{isRetrying ? 'Reconnecting...' : 'Retry Connection'}</span>
        </button>
      )}

      <div className="mt-6 pt-4 border-t border-[#E4E7EC] text-[11px] text-[#667085] font-mono flex items-center gap-2">
        <Terminal size={12} className="text-slate-500" />
        <span>Ensure demo-server (port 5001) or Express server (port 3001) is active</span>
      </div>
    </div>
  );
}

