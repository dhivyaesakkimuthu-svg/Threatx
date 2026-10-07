interface SecurityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function SecurityScoreRing({ score = 100, size = 120, strokeWidth = 10 }: SecurityScoreRingProps) {
  const safeScore = typeof score === 'number' && Number.isFinite(score) && !isNaN(score) ? Math.min(100, Math.max(0, Math.round(score))) : 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: 'url(#scoreGradGreen)', text: 'text-emerald-400' };
    if (s >= 60) return { stroke: 'url(#scoreGradAmber)', text: 'text-amber-400' };
    return { stroke: 'url(#scoreGradRed)', text: 'text-red-400' };
  };

  const { stroke, text } = getColor(safeScore);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="scoreGradGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="scoreGradAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="scoreGradRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Active Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold tracking-tight ${text}`}>{safeScore}%</span>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}
