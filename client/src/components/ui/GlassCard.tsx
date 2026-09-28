import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div className={`bg-white border border-[#E4E7EC] rounded-xl shadow-sm p-5 ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
