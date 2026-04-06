/**
 * SpriteFaceFrames – cycles through face1/face2/face3 PNG frames with a
 * Q-bounce (squish-and-stretch) CSS animation on the stage wrapper.
 *
 * Frame cycle:  face1 (O_O) → face2 (−_O wink) → face3 (−_−  sleepy) → …
 *
 * `reactBurst` speeds up the cycle briefly for extra liveliness on interaction.
 */

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import face1 from "@/assets/sprites/face1.png";
import face2 from "@/assets/sprites/face2.png";
import face3 from "@/assets/sprites/face3.png";
import styles from "./SpriteFaceFrames.module.css";

const FRAMES = [face1, face2, face3] as const;

const CYCLE_MS_NORMAL = 2550;
const CYCLE_MS_REACT  = 1800;

interface SpriteFaceFramesProps {
  /** Width in px; height is derived from the natural aspect-ratio via CSS. */
  size?: number;
  /** Trigger a brief burst of faster animation + spring jiggle. */
  reactBurst?: boolean;
}

const SpriteFaceFrames = ({ size = 320, reactBurst = false }: SpriteFaceFramesProps) => {
  const [frame, setFrame] = useState(0);

  const cycleMs = reactBurst ? CYCLE_MS_REACT : CYCLE_MS_NORMAL;
  const frameMs = Math.max(1, Math.round(cycleMs / FRAMES.length));

  useEffect(() => {
    const id = window.setInterval(() => {
      setFrame((i) => (i + 1) % FRAMES.length);
    }, frameMs);
    return () => clearInterval(id);
  }, [frameMs]);

  return (
    <motion.div
      style={{ width: size }}
      animate={
        reactBurst
          ? {
              scale:  [1, 1.1, 0.9, 1.06, 1],
              rotate: [0, -2.5, 2.5, -1, 0],
            }
          : {}
      }
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div
        className={`${styles.stage} ${reactBurst ? styles.stageReact : ""}`}
        aria-label="小精灵表情动画"
      >
        <img
          key={frame}
          className={styles.frame}
          src={FRAMES[frame]}
          alt=""
          draggable={false}
        />
      </div>
    </motion.div>
  );
};

export default SpriteFaceFrames;
