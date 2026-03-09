import { useCallback, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface CircularTimePickerProps {
  bedtime: string;
  wakeTime: string;
  onBedtimeChange: (time: string) => void;
  onWakeTimeChange: (time: string) => void;
}

const RING_SIZE = 240;
const STROKE_WIDTH = 32;
const CENTER = RING_SIZE / 2;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const LABEL_R = RING_SIZE / 2 + 16;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function minutesToAngle(mins: number): number {
  return (mins / 1440) * 360;
}

function angleToMinutes(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  return Math.round((normalized / 360) * 1440 / 5) * 5;
}

function polarToCartesian(angle: number): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + RADIUS * Math.cos(rad),
    y: CENTER + RADIUS * Math.sin(rad),
  };
}

function describeArc(startAngle: number, endAngle: number): string {
  let sweep = endAngle - startAngle;
  if (sweep <= 0) sweep += 360;
  if (sweep >= 360) sweep = 359.99;
  const largeArc = sweep > 180 ? 1 : 0;
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function formatDuration(bedtime: string, wakeTime: string): string {
  let diff = timeToMinutes(wakeTime) - timeToMinutes(bedtime);
  if (diff <= 0) diff += 1440;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function HourLabels() {
  const labels = [0, 3, 6, 9, 12, 15, 18, 21];
  return (
    <>
      {labels.map((h) => {
        const angle = (h / 24) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = CENTER + LABEL_R * Math.cos(rad);
        const y = CENTER + LABEL_R * Math.sin(rad);
        const display = h === 0 ? "12a" : h === 12 ? "12p" : h < 12 ? `${h}a` : `${h - 12}p`;
        return (
          <text
            key={h}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="hsl(var(--muted-foreground))"
            fontSize={9}
            fontWeight={500}
            opacity={0.55}
          >
            {display}
          </text>
        );
      })}
    </>
  );
}

function HourTicks() {
  const ticks = [];
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const isMain = i % 6 === 0;
    const isMid = i % 2 === 0;
    const outerR = RING_SIZE / 2 - 2;
    const innerR = outerR - (isMain ? 10 : isMid ? 5 : 3);
    ticks.push(
      <line
        key={i}
        x1={CENTER + innerR * Math.cos(rad)}
        y1={CENTER + innerR * Math.sin(rad)}
        x2={CENTER + outerR * Math.cos(rad)}
        y2={CENTER + outerR * Math.sin(rad)}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={isMain ? 1.5 : 0.5}
        opacity={isMain ? 0.35 : 0.12}
      />
    );
  }
  return <>{ticks}</>;
}

const CircularTimePicker = ({
  bedtime,
  wakeTime,
  onBedtimeChange,
  onWakeTimeChange,
}: CircularTimePickerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<"bed" | "wake" | null>(null);

  const bedAngle = minutesToAngle(timeToMinutes(bedtime));
  const wakeAngle = minutesToAngle(timeToMinutes(wakeTime));

  const getAngleFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const svgW = RING_SIZE + 40;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - CENTER * (rect.width / svgW);
    const y = clientY - rect.top - CENTER * (rect.height / svgW);
    let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  }, []);

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const angle = getAngleFromEvent(e);
      const mins = angleToMinutes(angle);
      const time = minutesToTime(mins);
      if (dragging === "bed") onBedtimeChange(time);
      else onWakeTimeChange(time);
    },
    [dragging, getAngleFromEvent, onBedtimeChange, onWakeTimeChange]
  );

  const handleUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleUp);
      return () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
        window.removeEventListener("touchmove", handleMove);
        window.removeEventListener("touchend", handleUp);
      };
    }
  }, [dragging, handleMove, handleUp]);

  const bedPos = polarToCartesian(bedAngle);
  const wakePos = polarToCartesian(wakeAngle);
  const arcPath = describeArc(bedAngle, wakeAngle);
  const duration = formatDuration(bedtime, wakeTime);

  const SVG_SIZE = RING_SIZE + 40;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SVG_SIZE, height: SVG_SIZE }}>
        <svg
          ref={svgRef}
          width={SVG_SIZE}
          height={SVG_SIZE}
          viewBox={`-20 -20 ${RING_SIZE + 40} ${RING_SIZE + 40}`}
          className="touch-none"
        >
          <defs>
            <linearGradient id="sleepArcGradient" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(240, 70%, 50%)" />
              <stop offset="50%" stopColor="hsl(260, 65%, 55%)" />
              <stop offset="100%" stopColor="hsl(300, 65%, 72%)" />
            </linearGradient>
            <filter id="arcGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" result="blur1" />
              <feColorMatrix in="blur1" type="matrix"
                values="0.3 0 0 0 0.15  0 0.05 0 0 0.05  0 0 0.5 0 0.7  0 0 0 0.5 0" result="colorBlur" />
              <feMerge>
                <feMergeNode in="colorBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feColorMatrix in="blur2" type="matrix"
                values="0.15 0 0 0 0.1  0 0 0 0 0.02  0 0 0.35 0 0.5  0 0 0 0.3 0" />
            </filter>
          </defs>

          {/* Outer glow */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + STROKE_WIDTH / 2 + 5}
            fill="none"
            stroke="hsl(260, 55%, 50%)"
            strokeWidth={2}
            opacity={0.12}
            filter="url(#outerGlow)"
          />

          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE_WIDTH}
            opacity={0.25}
          />

          <HourTicks />
          <HourLabels />

          {/* Active arc – always fully filled between bed→wake */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#sleepArcGradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            filter="url(#arcGlow)"
          />

          {/* Bedtime handle */}
          <g
            onMouseDown={() => setDragging("bed")}
            onTouchStart={() => setDragging("bed")}
            className="cursor-grab active:cursor-grabbing"
          >
            <circle cx={bedPos.x} cy={bedPos.y} r={18} fill="hsl(240, 70%, 50%)" stroke="hsl(var(--background))" strokeWidth={3} />
            <Moon x={bedPos.x - 8} y={bedPos.y - 8} width={16} height={16} className="text-primary-foreground pointer-events-none" />
          </g>

          {/* Wake handle */}
          <g
            onMouseDown={() => setDragging("wake")}
            onTouchStart={() => setDragging("wake")}
            className="cursor-grab active:cursor-grabbing"
          >
            <circle cx={wakePos.x} cy={wakePos.y} r={18} fill="hsl(300, 65%, 72%)" stroke="hsl(var(--background))" strokeWidth={3} />
            <Sun x={wakePos.x - 8} y={wakePos.y - 8} width={16} height={16} className="text-background pointer-events-none" />
          </g>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            className="text-4xl font-serif font-bold text-foreground tracking-tight"
            key={duration}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {duration}
          </motion.span>
          <span className="text-xs text-muted-foreground mt-1 italic">Optimal sleep time</span>
        </div>
      </div>

      {/* Time labels */}
      <div className="flex items-center justify-between w-full max-w-[240px] mt-3">
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5">
          <Moon className="w-3.5 h-3.5 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground">Bedtime</p>
            <p className="text-base font-bold text-foreground">{bedtime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-1.5">
          <Sun className="w-3.5 h-3.5 text-sleep-warning" />
          <div>
            <p className="text-[10px] text-muted-foreground">Wake up</p>
            <p className="text-base font-bold text-foreground">{wakeTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularTimePicker;
