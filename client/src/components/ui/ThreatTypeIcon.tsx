import type { LucideIcon } from 'lucide-react';
import { Globe, Clock, Monitor, Lock, Plane, FileWarning, FolderLock, Download, HelpCircle } from 'lucide-react';

interface ThreatConfig {
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const configMap: Record<string, ThreatConfig> = {
  unknown_ip: { icon: Globe, colorClass: 'text-[#D97706]', bgClass: 'bg-[#FFFBEB] border border-[#FEF3C7]' },
  unusual_login_time: { icon: Clock, colorClass: 'text-[#2563EB]', bgClass: 'bg-[#EFF6FF] border border-[#DBEAFE]' },
  new_device: { icon: Monitor, colorClass: 'text-[#0EA5A4]', bgClass: 'bg-[#F0FDFA] border border-[#CCFBF1]' },
  failed_login_attempts: { icon: Lock, colorClass: 'text-[#DC2626]', bgClass: 'bg-[#FEF2F2] border border-[#FEE2E2]' },
  impossible_travel: { icon: Plane, colorClass: 'text-[#EA580C]', bgClass: 'bg-[#FFF7ED] border border-[#FFEDD5]' },
  unauthorized_file_access: { icon: FileWarning, colorClass: 'text-[#D97706]', bgClass: 'bg-[#FFFBEB] border border-[#FEF3C7]' },
  restricted_folder_access: { icon: FolderLock, colorClass: 'text-[#DC2626]', bgClass: 'bg-[#FEF2F2] border border-[#FEE2E2]' },
  mass_download: { icon: Download, colorClass: 'text-[#DC2626]', bgClass: 'bg-[#FEF2F2] border border-[#FEE2E2]' },
};

export default function ThreatTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const cfg = configMap[type] || { icon: HelpCircle, colorClass: 'text-[#667085]', bgClass: 'bg-[#F8FAFC] border border-[#E4E7EC]' };
  const IconComponent = cfg.icon;

  return (
    <div className={`p-2 rounded-lg ${cfg.bgClass} flex items-center justify-center shrink-0`}>
      <IconComponent size={size} className={cfg.colorClass} />
    </div>
  );
}
