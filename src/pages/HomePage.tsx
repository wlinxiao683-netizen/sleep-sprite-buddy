import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Star, Heart } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import chatIconImg from "@/assets/sprites/ChatIcon.png";
import { toast } from "sonner";
import SleepSprite, { SpriteType, spriteNames, GlowType } from "@/components/SleepSprite";
import { useSleepPlanContext } from "@/contexts/sleep-plan-context";
import { useSleepLogs } from "@/hooks/use-sleep-logs";
import { useBedtimeReminder } from "@/hooks/use-bedtime-reminder";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addHappinessPoint,
  clearHappinessPoints,
  getHappinessPoints,
  getOwnedRedeemableDecorIds,
  HAPPINESS_POINTS_PER_REWARD,
  qualifiesForHappinessPoint,
  redeemDecorationForPoints,
  REDEEMABLE_DECORATIONS,
  type DecorationId,
} from "@/lib/happiness-bubble-points";

/** Today page only shows Lulu (unicorn). */
const LULU_SPRITE: SpriteType = "unicorn";

interface ThermosBubble {
  id: number;
  label: string;
  reward: string;
  fill: number;
  angle: number;
  distance: number;
}

const HAPPINESS_BUBBLE_ID = 0;

const DECORATION_ITEMS: {
  key: string;
  icon: string;
  name: string;
  redeemId: DecorationId | null;
}[] = [
  { key: "golden_star", icon: "⭐", name: "Golden Star", redeemId: null },
  { key: "night_crown", icon: "👑", name: "Night Crown", redeemId: null },
  { key: "dream_wings", icon: "🦋", name: "Dream Wings", redeemId: "dream_wings" },
  { key: "moon_halo", icon: "🌙", name: "Moon Halo", redeemId: "moon_halo" },
];

interface HomePageProps {
  onOpenChat?: () => void;
}

const HomePage = ({ onOpenChat }: HomePageProps) => {
  const sleepHours = 7.75;
  const [spriteXP, setSpriteXP] = useState(1280);
  const [claimedRewards, setClaimedRewards] = useState<number[]>([]);
  const [showReward, setShowReward] = useState<string | null>(null);
  const { getCosyMugFill, activatedAt, resetActivation, bedtime, wakeTime, bufferMinutes, loaded } =
    useSleepPlanContext();
  const { isTodayDone, collectToday, timeoutToday, autoFillYesterday, getYesterdayQuality } = useSleepLogs();
  const [cosyMugFill, setCosyMugFill] = useState(0);
  const { showBufferAlert, dismissBufferAlert } = useBedtimeReminder(bufferMinutes, activatedAt, loaded);

  const [happinessPoints, setHappinessPointsState] = useState(0);
  const [ownedRedeemDecor, setOwnedRedeemDecor] = useState<Set<DecorationId>>(() => new Set());
  const [redeemSheetOpen, setRedeemSheetOpen] = useState(false);

  const refreshHappinessProgress = useCallback(() => {
    setHappinessPointsState(getHappinessPoints());
    setOwnedRedeemDecor(getOwnedRedeemableDecorIds());
  }, []);

  useEffect(() => {
    refreshHappinessProgress();
  }, [refreshHappinessProgress]);

  // Yesterday's glow
  const [yesterdayGlow, setYesterdayGlow] = useState<GlowType>("none");
  useEffect(() => {
    (async () => {
      const q = await getYesterdayQuality();
      if (q === null) setYesterdayGlow("none");
      else if (q >= 70) setYesterdayGlow("green");
      else if (q >= 40) setYesterdayGlow("yellow");
      else setYesterdayGlow("red");
    })();
  }, [getYesterdayQuality]);

  // Auto-fill yesterday's log on mount
  useEffect(() => {
    autoFillYesterday(bedtime, wakeTime);
  }, [autoFillYesterday, bedtime, wakeTime]);

  // Update cosy mug fill every 10 seconds, handle auto-reset
  useEffect(() => {
    const update = () => {
      // If today is already done (collected or timed out), show 0
      if (isTodayDone) {
        setCosyMugFill(0);
        return;
      }
      const fill = getCosyMugFill();
      if (fill === -1) {
        // Auto-reset after 10 min past bedtime — mark as timed out
        setCosyMugFill(0);
        timeoutToday(bedtime, wakeTime);
        resetActivation();
      } else {
        setCosyMugFill(fill);
      }
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [getCosyMugFill, resetActivation, isTodayDone, timeoutToday, bedtime, wakeTime]);

  const [thermosBubbles, setThermosBubbles] = useState<ThermosBubble[]>([
    {
      id: HAPPINESS_BUBBLE_ID,
      label: "Happiness Bubble",
      reward: "Happiness Bubble",
      fill: 0,
      angle: 0,
      distance: 118,
    },
  ]);

  useEffect(() => {
    setThermosBubbles((prev) =>
      prev.map((b) => (b.id === HAPPINESS_BUBBLE_ID ? { ...b, fill: cosyMugFill } : b))
    );
  }, [cosyMugFill]);

  const handleClaimReward = async (bubble: ThermosBubble) => {
    if (
      bubble.id !== HAPPINESS_BUBBLE_ID ||
      bubble.fill <= 0 ||
      claimedRewards.includes(bubble.id) ||
      isTodayDone
    ) {
      return;
    }
    setClaimedRewards((prev) => [...prev, bubble.id]);
    setShowReward(bubble.reward);
    await collectToday(bubble.fill, bedtime, wakeTime);
    await resetActivation();

    const collectedAt = new Date();
    if (qualifiesForHappinessPoint(bedtime, collectedAt)) {
      const next = addHappinessPoint();
      setHappinessPointsState(next);
      toast.success(`+1 happiness point (${next}/${HAPPINESS_POINTS_PER_REWARD})`);
    } else {
      toast.message(
        "Collected — no point today. Collect on or before bedtime, or within 10 minutes after, to earn a happiness point."
      );
    }

    setTimeout(() => setShowReward(null), 2500);
  };

  const allRedeemableOwned =
    REDEEMABLE_DECORATIONS.every((d) => ownedRedeemDecor.has(d.id));

  const openRedeemFlow = () => {
    if (happinessPoints < HAPPINESS_POINTS_PER_REWARD) {
      toast.message(
        `Earn ${HAPPINESS_POINTS_PER_REWARD} happiness points (on-time collections) to redeem a decoration.`
      );
      return;
    }
    setRedeemSheetOpen(true);
  };

  const handleRedeemPick = (id: DecorationId, name: string) => {
    if (redeemDecorationForPoints(id)) {
      refreshHappinessProgress();
      toast.success(`Unlocked ${name}!`);
      setRedeemSheetOpen(false);
    }
  };

  const handleClearPointsWhenFullyUnlocked = () => {
    clearHappinessPoints();
    setHappinessPointsState(0);
    setRedeemSheetOpen(false);
    toast.message("Happiness points cleared.");
  };

  const spriteStatus = sleepHours >= 8
    ? { text: "Feeling amazing!", emoji: "🌟" }
    : sleepHours >= 7
    ? { text: "Well rested!", emoji: "😊" }
    : sleepHours >= 6
    ? { text: "A bit tired...", emoji: "😐" }
    : { text: "Needs more sleep!", emoji: "😴" };

  return (
    <div className="min-h-screen pb-24 px-6">
      {/* Chat icon – fixed top-right of the viewport */}
      <motion.button
        className="fixed z-40"
        style={{ top: 14, right: 14 }}
        onClick={onOpenChat}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 350, damping: 20 }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.88 }}
        aria-label="打开聊天"
      >
        <motion.img
          src={chatIconImg}
          alt="chat"
          style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(160,120,255,0.45))" }}
          animate={{ y: [100, 120, 100] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.button>

      {/* Header */}
      <motion.div
        className="pt-8 pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
        <p className="text-muted-foreground">Sunday, February 2</p>
      </motion.div>

      {/* Sprite + Thermos Bubbles */}
      <motion.div
        className="flex flex-col items-center pt-4 pb-2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative" style={{ width: 300, height: 300 }}>
          {/* Sprite centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <SleepSprite
              spriteType={LULU_SPRITE}
              sleepHours={sleepHours}
              size="lg"
              showControls={false}
              yesterdayGlow={yesterdayGlow}
            />
          </div>

          {/* Floating thermos bubbles */}
          {thermosBubbles.map((bubble) => {
            const isHappinessBubble = bubble.id === HAPPINESS_BUBBLE_ID;
            const isClaimed = claimedRewards.includes(bubble.id);
            const canClaim = isHappinessBubble && bubble.fill > 0 && !isClaimed;
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
                  y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                }}
                whileHover={canClaim ? { scale: 1.15 } : {}}
                whileTap={canClaim ? { scale: 0.9 } : {}}
              >
                {/* Bubble background with fill level */}
                <div
                  className={`relative w-14 h-14 rounded-full border-2 overflow-hidden flex flex-col items-center justify-center transition-all ${
                    isClaimed
                      ? "border-primary/30 bg-primary/5"
                      : canClaim
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
                        <Heart className="w-5 h-5 text-primary" />
                        <span className="text-[7px] font-medium text-muted-foreground mt-0.5">
                          {bubble.fill}%
                        </span>
                      </>
                    )}
                  </div>

                  {/* Glow pulse when claimable */}
                  {canClaim && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className="block text-[8px] text-muted-foreground text-center mt-0.5 font-medium max-w-[72px] leading-tight">
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

        {/* Sprite status */}
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-lg font-semibold text-foreground">
            {spriteNames[LULU_SPRITE]} {spriteStatus.emoji}
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
                Collected: {showReward}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Happiness points only — fill/collect is the bubble above the sprite */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          type="button"
          onClick={openRedeemFlow}
          className={`w-full glass-card p-4 text-left transition-all rounded-2xl border border-transparent ${
            happinessPoints >= HAPPINESS_POINTS_PER_REWARD
              ? "ring-2 ring-primary/50 cursor-pointer hover:bg-primary/5"
              : "opacity-95"
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-primary" />
              Happiness points
            </span>
            <span className="text-xs font-medium text-primary tabular-nums">
              {happinessPoints} / {HAPPINESS_POINTS_PER_REWARD}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{
                width: `${(happinessPoints / HAPPINESS_POINTS_PER_REWARD) * 100}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug">
            On-time bubble collections earn <span className="text-foreground font-medium">1 point</span> per day.
            At <span className="text-foreground font-medium">3 points</span>, tap here to redeem a decoration.
          </p>
          {happinessPoints >= HAPPINESS_POINTS_PER_REWARD && (
            <p className="text-[10px] text-primary font-medium mt-2">Tap to redeem — 3 points</p>
          )}
        </button>
      </motion.div>

      {/* Decorations & Collectibles */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          Decorations
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {DECORATION_ITEMS.map((item) => {
            const unlocked =
              item.redeemId === null || ownedRedeemDecor.has(item.redeemId);
            return (
              <motion.div
                key={item.key}
                className={`glass-card aspect-square rounded-xl flex flex-col items-center justify-center gap-1 ${
                  unlocked ? "bg-primary/10" : "bg-muted/30"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className={`text-2xl ${!unlocked && "opacity-30 grayscale"}`}>{item.icon}</span>
                <span className="text-[8px] text-muted-foreground font-medium text-center px-0.5 leading-tight">
                  {unlocked ? item.name : "🔒 3 pts"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Sheet open={redeemSheetOpen} onOpenChange={setRedeemSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Redeem decoration</SheetTitle>
            <SheetDescription>
              Spend {HAPPINESS_POINTS_PER_REWARD} happiness points to unlock one item.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-3 pb-8">
            {allRedeemableOwned && happinessPoints >= HAPPINESS_POINTS_PER_REWARD ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You already unlocked every happiness decoration. Clear your points to start saving again.
                </p>
                <Button type="button" className="w-full rounded-xl" onClick={handleClearPointsWhenFullyUnlocked}>
                  Clear {happinessPoints} points
                </Button>
              </div>
            ) : (
              REDEEMABLE_DECORATIONS.filter((d) => !ownedRedeemDecor.has(d.id)).map((d) => (
                <Button
                  key={d.id}
                  type="button"
                  variant="secondary"
                  className="w-full h-auto py-3 rounded-xl justify-start gap-3"
                  onClick={() => handleRedeemPick(d.id, d.name)}
                >
                  <span className="text-2xl">{d.icon}</span>
                  <span className="flex flex-col items-start text-left">
                    <span className="font-semibold text-foreground">{d.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {HAPPINESS_POINTS_PER_REWARD} happiness points
                    </span>
                  </span>
                </Button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 5-min Buffer Alert */}
      <AlertDialog open={showBufferAlert} onOpenChange={dismissBufferAlert}>
        <AlertDialogContent className="rounded-2xl max-w-xs mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg">🌙 5 Minutes Until Bedtime!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Time to start winding down. Put away your screens and get cozy — your sprite is counting on you!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction onClick={dismissBufferAlert} className="rounded-xl">
              Got it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default HomePage;