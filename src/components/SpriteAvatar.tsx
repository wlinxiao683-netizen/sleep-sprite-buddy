/**
 * SpriteAvatar – SVG sprite face with Q-bounce expression transitions.
 *
 * Expression cycle: normal (O_O) → wink (−_O) → sleepy (−_−) → normal …
 *
 * Each eye is drawn as a rounded-rect / arc shape that morphs between:
 *   open  = tall rounded rect  (O)
 *   closed = flat arc           (−)
 * The morph is achieved by animating `ry` (vertical radius) of an ellipse
 * with a very stiff spring so the squish is snappy and Q-bouncy.
 */

import { motion, useSpring, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export type Expression = "normal" | "wink" | "sleepy";

interface SpriteAvatarProps {
  /** Controlled expression – if provided, autoAnimate is ignored */
  expression?: Expression;
  size?: number;
  autoAnimate?: boolean;
  onClick?: () => void;
  /** Dark background mode (black face) */
  dark?: boolean;
}

// ---------------------------------------------------------------------------
// Single eye component
// ---------------------------------------------------------------------------

interface EyeProps {
  cx: number;   // horizontal centre in the 180-unit viewBox
  cy: number;   // vertical centre
  open: boolean;  // true = O, false = − (arc)
  // for wink the left eye closes immediately with a slight delay,
  // for sleepy both close together
  delay?: number;
  faceColor: string;
  eyeWhite: string;
}

const EYE_RX = 13;  // horizontal radius – stays constant
const EYE_RY_OPEN = 15;  // vertical radius when open
const EYE_RY_CLOSED = 3; // vertical radius when closed (flat arc look)

const Eye = ({ cx, cy, open, delay = 0, faceColor, eyeWhite }: EyeProps) => {
  const ry = useSpring(open ? EYE_RY_OPEN : EYE_RY_CLOSED, {
    stiffness: 700,
    damping: 16,
    mass: 0.5,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      ry.set(open ? EYE_RY_OPEN : EYE_RY_CLOSED);
    }, delay);
    return () => clearTimeout(t);
  }, [open, delay]);

  // Pupil / shine only visible when open enough
  const pupilOpacity = useTransform(ry, [EYE_RY_CLOSED + 2, EYE_RY_CLOSED + 7], [0, 1]);

  // When closed, the flat arch needs a cover – we clip the bottom half of the
  // ellipse by placing an opaque rectangle over the lower portion that scales
  // with ry so it always looks like a clean arc.

  return (
    <g>
      {/* White eyeball */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={EYE_RX}
        style={{ ry } as never}
        fill={eyeWhite}
      />
      {/* Cover the bottom half to make a clean closed arc */}
      <motion.rect
        x={cx - EYE_RX - 1}
        y={cy}
        width={EYE_RX * 2 + 2}
        height={EYE_RY_OPEN + 4}
        fill={faceColor}
      />
      {/* Pupil */}
      <motion.circle
        cx={cx}
        cy={cy - 1}
        r={6}
        fill="#111"
        style={{ opacity: pupilOpacity }}
      />
      {/* Shine */}
      <motion.circle
        cx={cx + 3.5}
        cy={cy - 5}
        r={2.5}
        fill="white"
        style={{ opacity: pupilOpacity }}
      />
      {/* Upper eyelid arc that covers the top of the ellipse when closing –
          same colour as face so the eye becomes a downward arc */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={EYE_RX + 2}
        style={{ ry: useTransform(ry, (v) => Math.max(0, EYE_RY_OPEN - v + 1)) } as never}
        fill={faceColor}
      />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Mouth component – morphs between a small and wide U-curve
// ---------------------------------------------------------------------------
interface MouthProps {
  expression: Expression;
}
const MOUTHS: Record<Expression, string> = {
  normal: "M 72 107 Q 90 116 108 107",
  wink:   "M 70 106 Q 90 118 110 106",
  sleepy: "M 74 108 Q 90 114 106 108",
};

const Mouth = ({ expression }: MouthProps) => {
  const [d, setD] = useState(MOUTHS[expression]);

  useEffect(() => {
    setD(MOUTHS[expression]);
  }, [expression]);

  return (
    <motion.path
      d={d}
      animate={{ d: MOUTHS[expression] }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      stroke="white"
      strokeWidth={3.5}
      strokeLinecap="round"
      fill="none"
    />
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const SEQUENCE: Expression[] = ["normal", "wink", "sleepy"];
const DURATIONS = [2200, 1800, 2400];

const SpriteAvatar = ({
  expression: externalExpr,
  size = 200,
  autoAnimate = true,
  onClick,
  dark = true,
}: SpriteAvatarProps) => {
  const [expression, setExpression] = useState<Expression>("normal");
  const idxRef = useRef(0);

  useEffect(() => {
    if (externalExpr !== undefined) {
      setExpression(externalExpr);
      return;
    }
    if (!autoAnimate) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      idxRef.current = (idxRef.current + 1) % SEQUENCE.length;
      setExpression(SEQUENCE[idxRef.current]);
      setTimeout(tick, DURATIONS[idxRef.current]);
    };
    const timer = setTimeout(tick, DURATIONS[0]);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [externalExpr, autoAnimate]);

  const faceColor = dark ? "#0a0a0a" : "#f8f4ff";
  const eyeWhite = dark ? "white" : "white";
  const headFill = dark ? "#111" : "#2a2a4a";

  const leftOpen = expression === "normal";
  const rightOpen = expression === "normal" || expression === "wink";

  // Body float animation
  const floatY = useSpring(0, { stiffness: 60, damping: 12 });
  useEffect(() => {
    let fwd = true;
    const loop = () => {
      floatY.set(fwd ? -9 : 0);
      fwd = !fwd;
    };
    loop();
    const id = setInterval(loop, 1400);
    return () => clearInterval(id);
  }, []);

  // Squish on tap
  const [tapped, setTapped] = useState(false);

  return (
    <motion.div
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={() => { setTapped(true); setTimeout(() => setTapped(false), 600); onClick?.(); }}
    >
      <motion.svg
        viewBox="0 0 180 180"
        width={size}
        height={size}
        style={{ overflow: "visible", y: floatY }}
        animate={tapped ? { scaleX: [1, 1.25, 0.85, 1.1, 1], scaleY: [1, 0.75, 1.2, 0.92, 1] } : {}}
        transition={tapped ? { duration: 0.55, times: [0, 0.2, 0.45, 0.7, 1], ease: "easeOut" } : {}}
      >
        {/* Head */}
        <circle cx={90} cy={90} r={72} fill={headFill} />

        {/* Eyes */}
        <Eye
          cx={63}
          cy={80}
          open={leftOpen}
          delay={expression === "wink" ? 0 : 0}
          faceColor={headFill}
          eyeWhite={eyeWhite}
        />
        <Eye
          cx={117}
          cy={80}
          open={rightOpen}
          delay={expression === "sleepy" ? 80 : 0}
          faceColor={headFill}
          eyeWhite={eyeWhite}
        />

        {/* Nose dot */}
        <circle cx={90} cy={97} r={2.5} fill="rgba(255,255,255,0.4)" />

        {/* Mouth */}
        <Mouth expression={expression} />
      </motion.svg>
    </motion.div>
  );
};

export default SpriteAvatar;
