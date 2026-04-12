import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import yawnVideo from "@/assets/sprites/4月12日 (5)(2).mp4";
import answerVideo from "@/assets/sprites/4123.mp4"; // 这里改成你的 answer 视频
import awakeVideo from "@/assets/sprites/4121.mp4";
import talkVideo from "@/assets/sprites/4122.mp4";

type VideoPhase = "awake" | "talk" | "answer" | "yawn";

const PALETTE = ["#e8b4ff", "#c4a3ff", "#a0e8ff", "#ffe0a0", "#ffb4d0", "#b4ffe8"];
const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const edge = i % 4;
  const rnd = Math.random();
  const x = edge === 0 ? rnd * 100 : edge === 1 ? 82 + rnd * 18 : edge === 2 ? rnd * 100 : rnd * 18;
  const y = edge === 0 ? rnd * 16 : edge === 1 ? rnd * 100 : edge === 2 ? 84 + rnd * 16 : rnd * 100;

  return {
    id: i,
    x,
    y,
    size: 2 + Math.random() * 5,
    dur: 3 + Math.random() * 4,
    delay: Math.random() * 3,
    color: PALETTE[i % PALETTE.length],
  };
});

export interface ChatScreenProps {
  open: boolean;
  isLandscape: boolean;
  onClose: () => void;
}

const ChatScreen = ({ open, isLandscape, onClose }: ChatScreenProps) => {
  const [videoPhase, setVideoPhase] = useState<VideoPhase>("awake");

  useEffect(() => {
    setVideoPhase("awake");
  }, [open]);

  const currentVideoSrc =
    videoPhase === "awake"
      ? awakeVideo
      : videoPhase === "talk"
      ? talkVideo
      : videoPhase === "answer"
      ? answerVideo
      : yawnVideo;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "#000" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            className="fixed inset-0 z-50 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                }}
                animate={{ opacity: [0.2, 0.85, 0.2], scale: [0.7, 1.4, 0.7] }}
                transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}

            <motion.div
              className="absolute"
              style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", stiffness: 240, damping: 20 }}
            >
              <video
                key={videoPhase}
                src={currentVideoSrc}
                autoPlay
                muted={false}
                loop={videoPhase === "yawn"}
                playsInline
                onEnded={() => {
                  if (videoPhase === "awake") setVideoPhase("talk");
                  else if (videoPhase === "talk") setVideoPhase("answer");
                  else if (videoPhase === "answer") setVideoPhase("yawn");
                }}
                style={{
                  maxHeight: "100%",
                  maxWidth: isLandscape ? "65%" : "92%",
                  objectFit: "contain",
                  borderRadius: 20,
                }}
              />
            </motion.div>

            <div
              style={{
                position: "absolute",
                top: "max(14px, env(safe-area-inset-top))",
                right: "max(14px, env(safe-area-inset-right))",
                display: "flex",
                gap: 8,
                zIndex: 10,
              }}
            >
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.82 }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ delay: 0.18, type: "spring", stiffness: 360, damping: 22 }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
                aria-label="Close"
              >
                <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.5} />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatScreen;