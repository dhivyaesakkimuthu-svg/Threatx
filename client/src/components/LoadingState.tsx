import { Shield, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingState({
  message = 'Connecting to ThreatX Security Engine...',
  subMessage = 'Querying telemetry & node telemetry metrics',
}: LoadingStateProps) {
  return (
    <div className="min-h-[360px] w-full flex flex-col items-center justify-center p-8 rounded-xl bg-white border border-[#E4E7EC] animate-fade-in text-center shadow-xs">
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Shield size={26} className="animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <RefreshCw size={14} className="animate-spin text-blue-600" />
        <h3 className="text-sm font-bold text-[#172033] tracking-wide">{message}</h3>
      </div>
      <p className="text-xs text-[#667085] font-mono max-w-sm">{subMessage}</p>
    </div>
  );
}

