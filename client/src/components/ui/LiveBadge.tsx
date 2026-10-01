export default function LiveBadge({ active = true, label = 'LIVE' }: { active?: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
      active
        ? 'bg-red-500/10 text-red-400 border-red-500/20'
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }`}>
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
      </span>
      {label}
    </span>
  );
}
