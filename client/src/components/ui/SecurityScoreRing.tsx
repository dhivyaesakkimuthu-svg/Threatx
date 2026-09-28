interface SecurityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function SecurityScoreRing({ score, size = 120, strokeWidth = 10 }: SecurityScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return { stroke: 'url(#scoreGradGreen)', text: 'text-[#059669]' };
    if (s >= 60) return { stroke: 'url(#scoreGradAmber)', text: 'text-[#D97706]' };
    return { stroke: 'url(#scoreGradRed)', text: 'text-[#DC2626]' };
  };

  const { stroke, text } = getColor(score);

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
          className="stroke-[#E4E7EC]"
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
        <span className={`text-2xl font-bold tracking-tight ${text}`}>{score}%</span>
        <span className="text-[10px] text-[#667085] font-semibold uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}
