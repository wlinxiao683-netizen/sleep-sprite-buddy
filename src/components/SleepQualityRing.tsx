import { motion } from "framer-motion";

interface SleepQualityRingProps {
  percentage: number;
  label?: string;
  size?: "sm" | "md" | "lg";
}

const SleepQualityRing = ({ percentage, label = "Sleep quality", size = "md" }: SleepQualityRingProps) => {
  const sizeConfig = {
    sm: { ring: 80, stroke: 6, text: "text-lg" },
    md: { ring: 120, stroke: 8, text: "text-2xl" },
    lg: { ring: 160, stroke: 10, text: "text-4xl" },
  };

  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={config.stroke}
          />
          <motion.circle
            cx={config.ring / 2}
            cy={config.ring / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`${config.text} font-bold text-foreground`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </div>

      {/* Label */}
      <div className="glass-card px-4 py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

export default SleepQualityRing;
