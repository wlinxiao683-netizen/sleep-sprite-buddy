import { motion, useAnimation, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Expression = "normal" | "wink" | "sleepy";

interface SpriteAvatarProps {
  expression?: Expression;
  size?: number;
  autoAnimate?: boolean;
  onClick?: () => void;
}

// Spring config for extremely elastic, Q-bounce feel
const bouncySpring = {
  type: "spring" as const,
  stiffness: 600,
  damping: 12,
  mass: 0.6,
};

const softSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 15,
  mass: 0.8,
};

// Eye shape data per expression
// Each eye is described as an SVG path relative to its center
// normal: open circle eyes
// wink: left eye closed (arc), right eye open
// sleepy: both eyes half-closed (arcs)

const EYE_RADIUS = 11;
const PUPIL_RADIUS = 5;

// Arc path for closed/half-closed eye (horizontal arc, "squinting")
const arcPath = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 0.7} ${cx + rx} ${cy}`;

// Full circle as path (for morphing to arc)
const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;

interface EyeProps {
  cx: number;
  cy: number;
  expression: Expression;
  isLeft: boolean;
}

const Eye = ({ cx, cy, expression, isLeft }: EyeProps) => {
  const isClosed = expression === "wink" && isLeft;
  const isSleepy = expression === "sleepy";

  // scaleY drives squish: 1 = open circle, 0 = flat line
  const scaleY = isClosed ? 0 : isSleepy ? 0.35 : 1;
  const scaleX = isClosed ? 1 : isSleepy ? 1.15 : 1;

  return (
    <g>
      {/* White sclera / eye bg */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={EYE_RADIUS}
        ry={EYE_RADIUS}
        fill="white"
        animate={{ scaleY, scaleX }}
        transition={bouncySpring}
        style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: "fill-box", transformOrigin: "center" }}
      />
      {/* Pupil */}
      <motion.circle
        cx={cx}
        cy={cy + (isSleepy ? 1 : 0)}
        r={PUPIL_RADIUS}
        fill="#1a1a2e"
        animate={{ scaleY: scaleY < 0.5 ? 0 : scaleY * 0.8 + 0.2, scaleX }}
        transition={bouncySpring}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      {/* Shine dot */}
      <motion.circle
        cx={cx + 3}
        cy={cy - 3}
        r={2.5}
        fill="white"
        animate={{ opacity: scaleY < 0.3 ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* Eyelid cover that slides down for wink/sleepy */}
      {(isClosed || isSleepy) && (
        <motion.ellipse
          cx={cx}
          cy={cy}
          rx={EYE_RADIUS + 1}
          ry={EYE_RADIUS + 1}
          fill="#1a1a2e"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isClosed ? 1 : 0.65 }}
          transition={bouncySpring}
          style={{ transformBox: "fill-box", transformOrigin: `${cx}px ${cy - EYE_RADIUS - 1}px` }}
        />
      )}
    </g>
  );
};

// Mouth shapes
interface MouthProps {
  expression: Expression;
}

const Mouth = ({ expression }: MouthProps) => {
  // normal: U-curve smile
  // wink: cheeky wide smile (wider U)
  // sleepy: gentle small arc / almost flat
  const paths = {
    normal: "M 70 98 Q 90 112 110 98",
    wink:   "M 64 96 Q 90 118 116 96",
    sleepy: "M 74 100 Q 90 106 106 100",
  };

  return (
    <motion.path
      d={paths[expression]}
      stroke="white"
      strokeWidth={3.5}
      strokeLinecap="round"
      fill="none"
      animate={{ d: paths[expression] }}
      transition={softSpring}
    />
  );
};

// Blush circles
interface BlushProps {
  expression: Expression;
}

const Blush = ({ expression }: BlushProps) => {
  const opacity = expression === "wink" ? 0.65 : expression === "sleepy" ? 0.45 : 0.3;
  return (
    <>
      <motion.ellipse cx={55} cy={108} rx={10} ry={6} fill="#ff9eb5" animate={{ opacity }} transition={{ duration: 0.4 }} />
      <motion.ellipse cx={125} cy={108} rx={10} ry={6} fill="#ff9eb5" animate={{ opacity }} transition={{ duration: 0.4 }} />
    </>
  );
};

// Z markers for sleepy expression
const ZZZ = ({ visible }: { visible: boolean }) => (
  <motion.g
    animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -10 }}
    transition={{ duration: 0.4 }}
  >
    {[0, 1, 2].map((i) => (
      <motion.text
        key={i}
        x={130 + i * 12}
        y={55 - i * 12}
        fontSize={10 + i * 3}
        fill="white"
        opacity={0.8 - i * 0.15}
        animate={visible ? { y: [55 - i * 12, 45 - i * 12], opacity: [0.8 - i * 0.15, 0] } : {}}
        transition={visible ? { duration: 2, repeat: Infinity, delay: i * 0.4, repeatDelay: 0.5 } : {}}
      >
        Z
      </motion.text>
    ))}
  </motion.g>
);

const SpriteAvatar = ({ expression: externalExpression, size = 200, autoAnimate = true, onClick }: SpriteAvatarProps) => {
  const [expression, setExpression] = useState<Expression>("normal");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);

  // Expression sequence: normal → wink → normal → sleepy → normal → ...
  const sequence: Expression[] = ["normal", "wink", "normal", "sleepy"];
  const durations = [2800, 1800, 2400, 3200];

  useEffect(() => {
    if (externalExpression !== undefined) {
      setExpression(externalExpression);
      return;
    }
    if (!autoAnimate) return;

    const tick = () => {
      sequenceRef.current = (sequenceRef.current + 1) % sequence.length;
      setExpression(sequence[sequenceRef.current]);
      timerRef.current = setTimeout(tick, durations[sequenceRef.current]);
    };

    timerRef.current = setTimeout(tick, durations[0]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [externalExpression, autoAnimate]);

  const scale = size / 180;

  // Body bounce animation — perpetual gentle float with a squish heartbeat
  const bodyAnim = {
    y: [0, -10, 0],
    scaleX: [1, 1.04, 1],
    scaleY: [1, 0.97, 1],
  };

  return (
    <motion.div
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      whileTap={{ scale: 0.88, transition: { type: "spring", stiffness: 800, damping: 10 } }}
      whileHover={{ scale: 1.06, transition: { type: "spring", stiffness: 400, damping: 12 } }}
    >
      <svg
        viewBox="0 0 180 200"
        width={size}
        height={size}
        style={{ overflow: "visible" }}
      >
        {/* Shadow */}
        <motion.ellipse
          cx={90}
          cy={195}
          rx={45}
          ry={8}
          fill="rgba(0,0,0,0.15)"
          animate={{ scaleX: [1, 1.1, 1], opacity: [0.15, 0.1, 0.15] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Body group - floats and squishes */}
        <motion.g
          style={{ transformOrigin: "90px 185px" }}
          animate={bodyAnim}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Ear left */}
          <motion.ellipse
            cx={42}
            cy={52}
            rx={18}
            ry={22}
            fill="#2a2a4a"
            animate={{ scaleY: expression === "wink" ? 1.1 : 1 }}
            transition={bouncySpring}
          />
          <ellipse cx={42} cy={54} rx={10} ry={13} fill="#3d3d6b" />

          {/* Ear right */}
          <motion.ellipse
            cx={138}
            cy={52}
            rx={18}
            ry={22}
            fill="#2a2a4a"
            animate={{ scaleY: expression === "wink" ? 1.1 : 1 }}
            transition={bouncySpring}
          />
          <ellipse cx={138} cy={54} rx={10} ry={13} fill="#3d3d6b" />

          {/* Head */}
          <motion.ellipse
            cx={90}
            cy={100}
            rx={60}
            ry={58}
            fill="#1e1e3a"
            animate={{
              scaleX: expression === "wink" ? 1.04 : expression === "sleepy" ? 0.98 : 1,
              scaleY: expression === "sleepy" ? 1.03 : 1,
            }}
            transition={bouncySpring}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />

          {/* Eyes */}
          <Eye cx={68} cy={93} expression={expression} isLeft={true} />
          <Eye cx={112} cy={93} expression={expression} isLeft={false} />

          {/* Blush */}
          <Blush expression={expression} />

          {/* Mouth */}
          <Mouth expression={expression} />

          {/* ZZZ */}
          <ZZZ visible={expression === "sleepy"} />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export type { Expression };
export default SpriteAvatar;
