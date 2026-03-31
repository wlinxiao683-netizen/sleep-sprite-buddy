import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import face1 from "@/assets/1.png";
import face2 from "@/assets/2.png";
import face3 from "@/assets/3.png";
import type { Expression } from "@/components/SpriteAvatar";
import styles from "./SpriteFaceFrames.module.css";

export type { Expression };

const FRAMES = [face1, face2, face3] as const;
const CYCLE_MS_NORMAL = 2550;
const CYCLE_MS_REACT = 2050;

interface SpriteFaceFramesProps {
  expression?: Expression;
  size?: number;
  dark?: boolean;
}

const ASPECT = 234 / 491;

const SpriteFaceFrames = ({
  expression,
  size = 600,
  dark = false,
}: SpriteFaceFramesProps) => {
  const [reactBurst, setReactBurst] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (expression === undefined) return;
    setReactBurst(true);
    const t = setTimeout(() => setReactBurst(false), 900);
    return () => clearTimeout(t);
  }, [expression]);

  const cycleMs = reactBurst ? CYCLE_MS_REACT : CYCLE_MS_NORMAL;
  const frameMs = Math.max(1, Math.round(cycleMs / 3));

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((i) => (i + 1) % FRAMES.length);
    }, frameMs);
    return () => clearInterval(id);
  }, [frameMs]);

  const height = Math.round(size * ASPECT);

  return (
    <motion.div
      className="relative"
      style={{ width: size, height }}
      animate={
        reactBurst
          ? {
              scale: [1, 1.08, 0.92, 1.05, 1],
              rotate: [0, -2, 2, -1, 0],
            }
          : {}
      }
      transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className={`${styles.stage} ${reactBurst ? styles.stageReact : ""}`}
        style={
          dark
            ? undefined
            : {
                filter: "drop-shadow(0 8px 24px hsl(var(--primary) / 0.25))",
              }
        }
        aria-label="小精灵表情动画"
      >
        <img className={styles.frame} src={FRAMES[frame]} alt="" draggable={false} />
      </div>
    </motion.div>
  );
};

export default SpriteFaceFrames;
