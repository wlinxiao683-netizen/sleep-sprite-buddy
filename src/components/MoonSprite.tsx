import { motion } from "framer-motion";

interface MoonSpriteProps {
  mood?: "happy" | "sleepy" | "tired" | "energized";
  size?: "sm" | "md" | "lg";
  showGlow?: boolean;
}

const MoonSprite = ({ mood = "happy", size = "lg", showGlow = true }: MoonSpriteProps) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
  };

  const moodEmojis = {
    happy: { eyes: "◠", mouth: "◡" },
    sleepy: { eyes: "─", mouth: "○" },
    tired: { eyes: "◡", mouth: "﹏" },
    energized: { eyes: "◠", mouth: "◡" },
  };

  const moodColors = {
    happy: "from-purple-300 via-purple-200 to-yellow-100",
    sleepy: "from-purple-400 via-purple-300 to-blue-200",
    tired: "from-purple-500 via-purple-400 to-gray-300",
    energized: "from-yellow-200 via-purple-200 to-pink-200",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      {showGlow && (
        <motion.div
          className={`absolute ${sizeClasses[size]} rounded-full`}
          style={{
            background: `conic-gradient(
              from 0deg,
              hsl(265 89% 66% / 0.8) 0deg,
              hsl(265 89% 66% / 0.2) 90deg,
              hsl(265 89% 66% / 0.8) 180deg,
              hsl(265 89% 66% / 0.2) 270deg,
              hsl(265 89% 66% / 0.8) 360deg
            )`,
            padding: "4px",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </motion.div>
      )}

      {/* Pulsing glow */}
      {showGlow && (
        <motion.div
          className={`absolute ${sizeClasses[size]} rounded-full bg-primary/20`}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            filter: "blur(20px)",
          }}
        />
      )}

      {/* Moon body */}
      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br ${moodColors[mood]} shadow-2xl overflow-hidden`}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Moon texture/craters */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[20%] left-[25%] w-8 h-8 rounded-full bg-purple-400/50" />
          <div className="absolute top-[50%] right-[20%] w-5 h-5 rounded-full bg-purple-400/40" />
          <div className="absolute bottom-[25%] left-[40%] w-4 h-4 rounded-full bg-purple-400/30" />
        </div>

        {/* Nightcap */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div 
              className="w-20 h-24 bg-gradient-to-b from-purple-600 via-purple-500 to-indigo-600"
              style={{
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                transform: "rotate(-15deg)",
              }}
            />
            {/* Stripes on cap */}
            <div 
              className="absolute inset-0 w-20 h-24"
              style={{
                background: "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)",
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                transform: "rotate(-15deg)",
              }}
            />
            {/* Pom pom */}
            <motion.div 
              className="absolute -top-3 left-6 w-6 h-6 rounded-full bg-gradient-to-br from-purple-200 to-purple-400"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>

        {/* Face */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          {/* Eyes */}
          <div className="flex gap-8 mb-2">
            <motion.div 
              className="text-2xl text-purple-900 font-bold"
              animate={mood === "sleepy" ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {moodEmojis[mood].eyes}
            </motion.div>
            <motion.div 
              className="text-2xl text-purple-900 font-bold"
              animate={mood === "sleepy" ? { opacity: [1, 0.3, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              {moodEmojis[mood].eyes}
            </motion.div>
          </div>
          {/* Blush */}
          <div className="flex gap-16 mb-1">
            <div className="w-4 h-2 rounded-full bg-pink-300/50" />
            <div className="w-4 h-2 rounded-full bg-pink-300/50" />
          </div>
          {/* Mouth */}
          <div className="text-xl text-purple-900">
            {moodEmojis[mood].mouth}
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/40 blur-sm" />
      </motion.div>

      {/* Stars around */}
      {showGlow && (
        <>
          <motion.div
            className="absolute -top-4 -right-8 text-primary text-xl"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✦
          </motion.div>
          <motion.div
            className="absolute top-12 -left-10 text-primary text-sm"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          >
            ✦
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -right-4 text-primary text-lg"
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            ✦
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MoonSprite;
