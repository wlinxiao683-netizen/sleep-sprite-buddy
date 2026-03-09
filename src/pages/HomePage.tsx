import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Sparkles, ExternalLink, Check, Gift, Star, Zap, Clock, Hourglass, Orbit, Sprout, Coffee } from "lucide-react";
import { useState, useEffect } from "react";
import SleepSprite, { SpriteType, spriteNames } from "@/components/SleepSprite";
import { useSleepPlan } from "@/hooks/use-sleep-plan";

const spriteOrder: SpriteType[] = ["unicorn", "koala", "sheep", "cat"];

interface ThermosBubble {
  id: number;
  icon: "classic" | "cosmic" | "nature" | "cozy";
  label: string;
  reward: string;
  fill: number;
  angle: number;
  distance: number;
}

const thermosIcons = {
  classic: Hourglass,
  cosmic: Orbit,
  nature: Sprout,
  cozy: Coffee,
};

const HomePage = () => {
  const [currentSpriteIndex, setCurrentSpriteIndex] = useState(0);
  const sleepHours = 7.75;
  const currentSprite = spriteOrder[currentSpriteIndex];
  const [spriteXP, setSpriteXP] = useState(1280);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [showReward, setShowReward] = useState<string | null>(null);
  const { getCosyMugFill, activatedAt, resetActivation } = useSleepPlan();
  const [cosyMugFill, setCosyMugFill] = useState(0);

  // Update cosy mug fill every 10 seconds, handle auto-reset
  useEffect(() => {
    const update = () => {
      const fill = getCosyMugFill();
      if (fill === -1) {
        // Auto-reset after 10 min past bedtime
        setCosyMugFill(0);
        resetActivation();
      } else {
        setCosyMugFill(fill);
      }
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [getCosyMugFill, resetActivation]);

  const [thermosBubbles, setThermosBubbles] = useState<ThermosBubble[]>([
    { id: 0, icon: "classic", label: "Capsule", reward: "Starry Scarf", fill: 0, angle: -75, distance: 155 },
    { id: 1, icon: "cosmic", label: "Cosmic", reward: "+80 XP", fill: 0, angle: 55, distance: 160 },
    { id: 2, icon: "nature", label: "Sprout", reward: "Night Sky BG", fill: 0, angle: -40, distance: 145 },
    { id: 3, icon: "cozy", label: "Cozy Mug", reward: "Golden Hat", fill: 0, angle: 80, distance: 150 },
  ]);

  // Sync Cozy Mug fill with activation timer
  useEffect(() => {
    setThermosBubbles((prev) =>
      prev.map((b) => (b.id === 3 ? { ...b, fill: cosyMugFill } : b))
    );
  }, [cosyMugFill]);

  const [contentFeed, setContentFeed] = useState([
    { id: 1, type: "video", title: "Lo-fi Beats Playlist", source: "YouTube", url: "#", enjoyed: false, xp: 15 },
    { id: 2, type: "article", title: "10 Tips for Better Morning Routines", source: "Medium", url: "#", enjoyed: false, xp: 10 },
    { id: 3, type: "game", title: "Stardew Valley - Farm Screenshot", source: "Steam", url: "#", enjoyed: false, xp: 20 },
  ]);

  const handlePrevSprite = () => {
    setCurrentSpriteIndex((prev) => (prev - 1 + spriteOrder.length) % spriteOrder.length);
  };
  const handleNextSprite = () => {
    setCurrentSpriteIndex((prev) => (prev + 1) % spriteOrder.length);
  };

  const handleClaimReward = (bubble: ThermosBubble) => {
    // Only cozy mug (id 3) can be claimed, and only when it has some fill and isn't already claimed
    if (bubble.id !== 3 || bubble.fill <= 0 || claimedRewards.includes(bubble.id)) return;
    setClaimedRewards((prev) => [...prev, bubble.id]);
    setShowReward(bubble.reward);
    if (bubble.reward.includes("XP")) {
      const xpMatch = bubble.reward.match(/\d+/);
      if (xpMatch) setSpriteXP((prev) => prev + parseInt(xpMatch[0]));
    }
    setTimeout(() => setShowReward(null), 2500);
  };

  const handleEnjoyed = (id: number) => {
    setContentFeed((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enjoyed: true } : item))
    );
    const item = contentFeed.find((i) => i.id === id);
    if (item) {
      setSpriteXP((prev) => prev + item.xp);
      // Add fill to random thermos
      setThermosBubbles((prev) =>
        prev.map((b, i) =>
          i === Math.floor(Math.random() * prev.length)
            ? { ...b, fill: Math.min(100, b.fill + item.xp) }
            : b
        )
      );
    }
  };

  const spriteStatus = sleepHours >= 8
    ? { text: "Feeling amazing!", emoji: "🌟" }
    : sleepHours >= 7
    ? { text: "Well rested!", emoji: "😊" }
    : sleepHours >= 6
    ? { text: "A bit tired...", emoji: "😐" }
    : { text: "Needs more sleep!", emoji: "😴" };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div
        className="px-6 pt-8 pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">Sunday, February 2</p>
      </motion.div>

      {/* Sprite + Thermos Bubbles */}
      <motion.div
        className="flex flex-col items-center pt-4 pb-2 px-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative" style={{ width: 300, height: 300 }}>
          {/* Sprite centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <SleepSprite
              spriteType={currentSprite}
              sleepHours={sleepHours}
              size="lg"
              showControls={true}
              onPrev={handlePrevSprite}
              onNext={handleNextSprite}
            />
          </div>

          {/* Floating thermos bubbles */}
          {thermosBubbles.map((bubble) => {
            const isFull = bubble.fill >= 100;
            const isClaimed = claimedRewards.includes(bubble.id);
            const rad = (bubble.angle * Math.PI) / 180;
            const x = 150 + bubble.distance * Math.sin(rad) - 28;
            const y = 150 - bubble.distance * Math.cos(rad) - 28;

            return (
              <motion.button
                key={bubble.id}
                className="absolute"
                style={{ left: x, top: y, width: 56, height: 56 }}
                onClick={() => handleClaimReward(bubble)}
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  y: { duration: 2.5 + bubble.id * 0.3, repeat: Infinity, ease: "easeInOut" },
                }}
                whileHover={isFull && !isClaimed ? { scale: 1.15 } : {}}
                whileTap={isFull && !isClaimed ? { scale: 0.9 } : {}}
              >
                {/* Bubble background with fill level */}
                <div
                  className={`relative w-14 h-14 rounded-full border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isClaimed
                      ? "border-primary/30 bg-primary/5"
                      : isFull
                      ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] cursor-pointer"
                      : "border-muted-foreground/20 bg-background/80"
                  }`}
                >
                  {/* Fill level indicator */}
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                    style={{
                      height: `${bubble.fill}%`,
                      background: isClaimed
                        ? "hsl(var(--primary) / 0.1)"
                        : `linear-gradient(to top, hsl(var(--primary) / 0.35), hsl(var(--accent) / 0.2))`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {isClaimed ? (
                      <Sparkles className="w-4 h-4 text-primary" />
                    ) : (
                      <>
                        {(() => { const Icon = thermosIcons[bubble.icon]; return <Icon className="w-5 h-5 text-primary" />; })()}
                        <span className="text-[7px] font-medium text-muted-foreground mt-0.5">
                          {bubble.fill}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Full glow pulse */}
                  {isFull && !isClaimed && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className="block text-[8px] text-muted-foreground text-center mt-0.5 font-medium">
                  {isClaimed ? "✓" : bubble.label}
                </span>

                {/* Confetti on claim */}
                {isClaimed && (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                        style={{ left: 28, top: 28 }}
                        initial={{ opacity: 1 }}
                        animate={{
                          x: (Math.random() - 0.5) * 50,
                          y: (Math.random() - 0.5) * 50,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{ duration: 0.7, delay: i * 0.04 }}
                      />
                    ))}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Sprite indicator dots */}
        <div className="flex gap-2 mt-1">
          {spriteOrder.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSpriteIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSpriteIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Sprite status */}
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-lg font-semibold text-foreground">
            {spriteNames[currentSprite]} {spriteStatus.emoji}
          </p>
          <p className="text-sm text-muted-foreground">{spriteStatus.text}</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-medium text-foreground">{spriteXP} XP</span>
          </div>
        </motion.div>

        {/* Reward toast */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              className="mt-2 py-2 px-4 rounded-full bg-primary/20 border border-primary/30 w-fit"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
            >
              <span className="text-xs text-primary font-medium flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Unlocked: {showReward}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-3 gap-3 px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { label: "Days Active", value: "15", icon: Clock },
          { label: "Sleep Streak", value: "7 🔥", icon: Zap },
          { label: "Total Stars", value: `${spriteXP}`, icon: Star },
        ].map((stat, index) => (
          <div key={index} className="glass-card p-3 text-center">
            <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Thermos Rewards Row */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <div className="flex items-center justify-between px-6 mb-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-primary" />
            Rewards
          </h2>
          <span className="text-[10px] text-muted-foreground">{claimedRewards.length}/{thermosBubbles.length} claimed</span>
        </div>

        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {thermosBubbles.map((bubble, index) => {
            const isClaimed = claimedRewards.includes(bubble.id);
            const isFull = bubble.fill >= 100;
            return (
              <motion.div
                key={bubble.id}
                className={`glass-card p-3 flex-shrink-0 w-24 relative overflow-hidden transition-all ${
                  isClaimed ? "opacity-50" : ""
                }`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.08 }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                  style={{
                    height: `${bubble.fill}%`,
                    background: isClaimed
                      ? "hsl(var(--primary) / 0.08)"
                      : "linear-gradient(to top, hsl(var(--primary) / 0.18), hsl(var(--accent) / 0.05))",
                  }}
                />
                <div className="relative z-10 flex flex-col items-center text-center gap-1">
                  {(() => { const Icon = thermosIcons[bubble.icon]; return <Icon className="w-4 h-4 text-primary" />; })()}
                  <p className="text-[10px] font-semibold text-foreground">{bubble.label}</p>
                  <div className="w-full h-1 rounded-full bg-muted/50">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${bubble.fill}%` }} />
                  </div>
                  {isClaimed ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : isFull ? (
                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                  ) : (
                    <span className="text-[9px] text-muted-foreground">{bubble.fill}%</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Decorations & Collectibles */}
      <motion.div
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          Decorations
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: "⭐", name: "Golden Star", unlocked: true },
            { icon: "👑", name: "Night Crown", unlocked: true },
            { icon: "🦋", name: "Dream Wings", unlocked: false },
            { icon: "🌙", name: "Moon Halo", unlocked: false },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`glass-card aspect-square rounded-xl flex flex-col items-center justify-center gap-1 ${
                item.unlocked ? "bg-primary/10" : "bg-muted/30"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={`text-2xl ${!item.unlocked && "opacity-30 grayscale"}`}>{item.icon}</span>
              <span className="text-[8px] text-muted-foreground font-medium">{item.unlocked ? item.name : "🔒"}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Content Feed */}
      <motion.div
        className="px-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-primary" />
            Saved for Later
          </h2>
          <span className="text-[10px] text-muted-foreground">From last night</span>
        </div>

        <div className="space-y-3">
          {contentFeed.map((item, index) => (
            <motion.div
              key={item.id}
              className={`glass-card p-4 transition-all ${item.enjoyed ? "opacity-60" : ""}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + index * 0.1 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">
                    {item.type === "video" ? "🎬" : item.type === "article" ? "📄" : "🎮"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.source}</p>
                </div>
                <a
                  href={item.url}
                  className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 hover:bg-muted/70 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>

              {!item.enjoyed ? (
                <motion.button
                  className="mt-3 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 btn-gradient"
                  onClick={() => handleEnjoyed(item.id)}
                  whileTap={{ scale: 0.97 }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark as Enjoyed (+{item.xp} XP)
                </motion.button>
              ) : (
                <div className="mt-3 w-full py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Enjoyed — XP added to {spriteNames[currentSprite]}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default HomePage;