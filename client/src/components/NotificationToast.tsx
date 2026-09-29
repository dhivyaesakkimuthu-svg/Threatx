import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, Info, X, ExternalLink } from 'lucide-react';
import type { ThreatEvent } from '../types';

export interface ToastNotification {
  id: string;
  threat?: ThreatEvent;
  title: string;
  type?: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source?: string;
  target?: string;
  timestamp: string | Date;
  onInvestigate?: () => void;
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  onInvestigate?: (threat: ThreatEvent) => void;
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
  onInvestigate,
}: NotificationToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => (
        <SingleToast
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
          onInvestigate={() => {
            if (toast.threat && onInvestigate) {
              onInvestigate(toast.threat);
            } else if (toast.onInvestigate) {
              toast.onInvestigate();
            }
          }}
        />
      ))}
    </div>
  );
}

function SingleToast({
  toast,
  onDismiss,
  onInvestigate,
}: {
  toast: ToastNotification;
  onDismiss: () => void;
  onInvestigate: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isCritical = toast.severity === 'critical';
  const isHigh = toast.severity === 'high';

  useEffect(() => {
    if (isPaused) return;

    const duration = isCritical ? 9000 : 6000;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, isCritical, onDismiss]);

  const getSeverityBadge = () => {
    switch (toast.severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
            LOW
          </span>
        );
    }
  };

  const getIcon = () => {
    if (isCritical) {
      return <ShieldAlert size={18} className="text-red-600 shrink-0" />;
    }
    if (isHigh) {
      return <AlertTriangle size={18} className="text-orange-600 shrink-0" />;
    }
    if (toast.severity === 'medium') {
      return <AlertTriangle size={18} className="text-amber-600 shrink-0" />;
    }
    return <Info size={18} className="text-blue-600 shrink-0" />;
  };

  const formattedTime = new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border bg-white p-4 shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${
        isCritical
          ? 'border-l-4 border-l-red-600 border-[#E4E7EC]'
          : isHigh
          ? 'border-l-4 border-l-orange-600 border-[#E4E7EC]'
          : 'border-l-4 border-l-blue-600 border-[#E4E7EC]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg border mt-0.5 ${
              isCritical
                ? 'bg-red-50 border-red-200'
                : isHigh
                ? 'bg-orange-50 border-orange-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getSeverityBadge()}
              <span className="text-[10px] text-[#667085] font-mono">{formattedTime}</span>
            </div>
            <h4 className="text-xs font-bold text-[#172033] leading-tight">{toast.title}</h4>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-slate-100 transition-colors"
          title="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Source and Target Metadata */}
      {(toast.source || toast.target) && (
        <div className="mt-2.5 pt-2 border-t border-[#E4E7EC] flex items-center justify-between text-[10px] font-mono text-[#667085]">
          {toast.source && (
            <span>
              Source: <strong className="text-[#172033]">{toast.source}</strong>
            </span>
          )}
          {toast.target && (
            <span>
              Target: <strong className="text-[#172033]">{toast.target}</strong>
            </span>
          )}
        </div>
      )}

      {/* Action footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[9px] font-mono text-[#667085] uppercase tracking-wider">
          Real-time Ingestion
        </span>
        <button
          onClick={onInvestigate}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold transition-all ${
            isCritical
              ? 'bg-red-600 hover:bg-red-700 text-gray-900 shadow-xs'
              : 'bg-blue-600 hover:bg-blue-700 text-gray-900 shadow-xs'
          }`}
        >
          Investigate <ExternalLink size={10} />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
        <div
          className={`h-full transition-all duration-75 ${
            isCritical
              ? 'bg-red-500'
              : isHigh
              ? 'bg-orange-500'
              : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default NotificationToastContainer;

