import type { LucideIcon } from 'lucide-react';
import { Globe, Clock, Monitor, Lock, Plane, FileWarning, FolderLock, Download, HelpCircle } from 'lucide-react';

interface ThreatConfig {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const configMap: Record<string, ThreatConfig> = {
  unknown_ip: { icon: Globe, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  unusual_login_time: { icon: Clock, colorClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  new_device: { icon: Monitor, colorClass: 'text-cyan-400', bgClass: 'bg-cyan-500/10' },
  failed_login_attempts: { icon: Lock, colorClass: 'text-red-400', bgClass: 'bg-red-500/10' },
  impossible_travel: { icon: Plane, colorClass: 'text-orange-400', bgClass: 'bg-orange-500/10' },
  unauthorized_file_access: { icon: FileWarning, colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  restricted_folder_access: { icon: FolderLock, colorClass: 'text-red-400', bgClass: 'bg-red-500/10' },
  mass_download: { icon: Download, colorClass: 'text-red-400', bgClass: 'bg-red-500/10 animate-pulse' },
};

export default function ThreatTypeIcon({ type, size = 18 }: { type: string; size?: number }) {
  const cfg = configMap[type] || { icon: HelpCircle, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10' };
  const IconComponent = cfg.icon;

  return (
    <div className={`p-2 rounded-lg ${cfg.bgClass} flex items-center justify-center shrink-0`}>
      <IconComponent size={size} className={cfg.colorClass} />
    </div>
  );
}
