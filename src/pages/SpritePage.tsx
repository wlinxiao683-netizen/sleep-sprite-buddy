import { motion } from "framer-motion";
import { useState } from "react";
import SleepSprite, { SpriteType, spriteNames } from "@/components/SleepSprite";
import { Sparkles, Heart, Gift, Info } from "lucide-react";

const spriteOrder: SpriteType[] = ["koala", "unicorn", "sheep", "cat"];

const SpritePage = () => {
  const [currentSpriteIndex, setCurrentSpriteIndex] = useState(0);
  const sleepHours = 7.5; // This would come from actual sleep data
  
  const currentSprite = spriteOrder[currentSpriteIndex];

  const handlePrevSprite = () => {
    setCurrentSpriteIndex((prev) => (prev - 1 + spriteOrder.length) % spriteOrder.length);
  };

  const handleNextSprite = () => {
    setCurrentSpriteIndex((prev) => (prev + 1) % spriteOrder.length);
  };

  const rewards = [
    { id: 1, name: "Golden Star", icon: "⭐", unlocked: true },
    { id: 2, name: "Night Crown", icon: "👑", unlocked: true },
    { id: 3, name: "Dream Wings", icon: "🦋", unlocked: false },
    { id: 4, name: "Moon Halo", icon: "🌙", unlocked: false },
  ];

  const stats = [
    { label: "Days Active", value: "15" },
    { label: "Sleep Streak", value: "7 🔥" },
    { label: "Total Stars", value: "234" },
  ];

  return (
    <div className="min-h-screen pb-24 px-6">
      {/* Header */}
      <motion.div 
        className="pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Sleep Sprite
        </h1>
        <p className="text-muted-foreground">Your sleep companion</p>
      </motion.div>

      {/* Sprite Display - Large, takes up ~50% of screen */}
      <motion.div 
        className="flex flex-col items-center justify-center py-8 px-6 min-h-[50vh]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <SleepSprite 
          spriteType={currentSprite}
          sleepHours={sleepHours}
          size="xl"
          showControls={true}
          onPrev={handlePrevSprite}
          onNext={handleNextSprite}
        />

        {/* Sprite indicator dots */}
        <div className="flex gap-2 mt-6">
          {spriteOrder.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSpriteIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentSpriteIndex 
                  ? "bg-primary w-5" 
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </motion.div>

      {/* Speech Bubble */}
      <motion.div 
        className="relative mx-auto max-w-xs mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-foreground font-medium mb-1">
            {spriteNames[currentSprite]}: {sleepHours >= 7 ? "Feeling great!" : "Need more rest..."} 
          </p>
          <p className="text-xs text-muted-foreground">
            Last night: <span className={sleepHours >= 7 ? "text-primary" : "text-sleep-warning"}>{sleepHours}h sleep</span>
          </p>
        </div>
        {/* Triangle pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-card border-l border-t border-border/50" />
      </motion.div>


      {/* Stats */}
      <motion.div 
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {stats.map((stat, index) => (
          <div key={index} className="glass-card p-4 text-center">
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Rewards */}
      <motion.div 
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-primary" />
          Rewards & Decorations
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center ${
                reward.unlocked 
                  ? "bg-primary/10" 
                  : "bg-muted/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={`text-2xl ${!reward.unlocked && "opacity-30 grayscale"}`}>
                {reward.icon}
              </span>
              {!reward.unlocked && (
                <span className="text-xs text-muted-foreground mt-1">🔒</span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rules Info */}
      <motion.button 
        className="w-full mt-4 p-3 flex items-center justify-center gap-2 text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Info className="w-4 h-4" />
        <span className="text-sm">How to earn rewards</span>
      </motion.button>
    </div>
  );
};

export default SpritePage;
