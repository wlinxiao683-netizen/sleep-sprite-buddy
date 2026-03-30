import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import koalaImg from "@/assets/sprites/koala.png";
import unicornImg from "@/assets/sprites/unicorn.png";
import sheepImg from "@/assets/sprites/sheep.png";
import catImg from "@/assets/sprites/cat.png";

export type SpriteType = "koala" | "unicorn" | "sheep" | "cat";

type GlowType = "green" | "yellow" | "red" | "none";

interface SleepSpriteProps {
  spriteType: SpriteType;
  sleepHours: number;
  size?: "sm" | "md" | "lg" | "xl";
  onPrev?: () => void;
  onNext?: () => void;
  showControls?: boolean;
  /** Override glow color based on yesterday's sleep quality */
  yesterdayGlow?: GlowType;
}

const spriteImages: Record<SpriteType, string> = {
  koala: koalaImg,
  unicorn: unicornImg,
  sheep: sheepImg,
  cat: catImg,
};

const spriteNames: Record<SpriteType, string> = {
  koala: "Koko",
  unicorn: "Lulu",
  sheep: "Woolly",
  cat: "Mimi",
};

const SleepSprite = ({ 
  spriteType, 
  sleepHours, 
  size = "lg", 
  onPrev, 
  onNext,
  showControls = false,
  yesterdayGlow = "none",
}: SleepSpriteProps) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
    xl: "w-72 h-72",
  };

  const glowSizeClasses = {
    sm: "w-32 h-32",
    md: "w-52 h-52",
    lg: "w-72 h-72",
    xl: "w-96 h-96",
  };

  // Yesterday's sleep quality glow colors
  const glowColorMap: Record<GlowType, { inner: string; outer: string }> = {
    green: { inner: "hsl(142 71% 45% / 0.5)", outer: "hsl(142 71% 45% / 0.3)" },
    yellow: { inner: "hsl(45 93% 47% / 0.5)", outer: "hsl(45 93% 47% / 0.3)" },
    red: { inner: "hsl(0 72% 51% / 0.5)", outer: "hsl(0 72% 51% / 0.3)" },
    none: { inner: "hsl(250 85% 65% / 0)", outer: "hsl(250 85% 65% / 0)" },
  };

  // Use yesterday glow if available, otherwise default behavior
  const useYesterdayGlow = yesterdayGlow !== "none";
  
  const isGoodSleep = sleepHours >= 7;
  const defaultGlowColor = isGoodSleep 
    ? "hsl(250 85% 65% / 0.35)"
    : "hsl(38 92% 50% / 0.35)";
  const defaultGlowInner = isGoodSleep 
    ? "hsl(300 70% 60% / 0.5)"
    : "hsl(38 92% 50% / 0.5)";

  const glowColor = useYesterdayGlow ? glowColorMap[yesterdayGlow].outer : defaultGlowColor;
  const glowColorInner = useYesterdayGlow ? glowColorMap[yesterdayGlow].inner : defaultGlowInner;

  return (
    <div className="relative flex items-center justify-center">
      {/* Navigation Controls */}
      {showControls && onPrev && (
        <motion.button
          className="absolute left-0 z-10 w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors"
          onClick={onPrev}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      )}

      <div className="relative">
        {/* Large top-left ambient glow */}
        <motion.div
          className="absolute -top-20 -left-20 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, hsl(var(--primary) / 0.1) 40%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Center Glow Effect */}
        <motion.div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${glowSizeClasses[size]}`}
          style={{
            background: `radial-gradient(circle, ${glowColorInner} 0%, ${glowColor} 40%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Sprite Image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={spriteType}
            className={`relative ${sizeClasses[size]}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -8, 0],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <img
              src={spriteImages[spriteType]}
              alt={`${spriteNames[spriteType]} sprite`}
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </motion.div>
        </AnimatePresence>

        {/* Sparkle decorations */}
        <motion.span
          className="absolute -top-2 -left-4 text-xl"
          animate={{ 
            rotate: [0, 15, 0, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute top-4 -right-2 text-lg"
          animate={{ 
            rotate: [0, -15, 0, 15, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          ⭐
        </motion.span>
      </div>

      {showControls && onNext && (
        <motion.button
          className="absolute right-0 z-10 w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition-colors"
          onClick={onNext}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

export type { GlowType };
export { spriteNames };
export default SleepSprite;
