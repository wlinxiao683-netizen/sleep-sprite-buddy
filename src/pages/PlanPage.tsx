import { motion, AnimatePresence } from "framer-motion";
import { Bell, Send, Check, Sparkles, Trash2, Mic, Calendar, Rocket, Timer, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import CircularTimePicker from "@/components/CircularTimePicker";
import { Slider } from "@/components/ui/slider";
import { useSleepPlanContext } from "@/contexts/sleep-plan-context";
import { useSleepLogs } from "@/hooks/use-sleep-logs";

interface WorryItem {
  id: number;
  text: string;
  absorbed: boolean;
}

const PlanPage = () => {
  const {
    bedtime,
    wakeTime,
    bufferMinutes,
    alarmEnabled,
    activatedAt,
    loaded,
    setBedtime,
    setWakeTime,
    setBufferMinutes,
    toggleAlarm,
    activate,
    resetActivation,
  } = useSleepPlanContext();
  const { resetTodayLog } = useSleepLogs();

  // Brain dump state
  const [worryInput, setWorryInput] = useState("");
  const [worries, setWorries] = useState<WorryItem[]>([]);
  const [nextWorryId, setNextWorryId] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync ritual state
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleAddWorry = () => {
    const trimmed = worryInput.trim();
    if (!trimmed) return;
    const newItem: WorryItem = { id: nextWorryId, text: trimmed, absorbed: false };
    setWorries((prev) => [newItem, ...prev]);
    setNextWorryId((prev) => prev + 1);
    setWorryInput("");

    setTimeout(() => {
      setWorries((prev) =>
        prev.map((w) => (w.id === newItem.id ? { ...w, absorbed: true } : w))
      );
    }, 800);

    setTimeout(() => {
      setWorries((prev) => prev.filter((w) => w.id !== newItem.id));
    }, 1600);

    inputRef.current?.focus();
  };

  const handleSync = async () => {
    setSyncing(true);
    await activate();
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      setTimeout(() => setSynced(false), 3000);
    }, 1500);
  };

  // Format buffer display
  const bufferDisplay = bufferMinutes >= 60
    ? `${Math.floor(bufferMinutes / 60)}h${bufferMinutes % 60 > 0 ? ` ${bufferMinutes % 60}m` : ""}`
    : `${bufferMinutes}m`;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6">
      {/* Header */}
      <motion.div
        className="pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-6 h-6 text-primary" />
          Sleep Plan
        </h1>
        <p className="text-muted-foreground">Set your sleep schedule</p>
      </motion.div>

      {/* 1. Sleep Schedule + Buffer + Alarm + Sync */}
      <motion.div
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CircularTimePicker
          bedtime={bedtime}
          wakeTime={wakeTime}
          onBedtimeChange={setBedtime}
          onWakeTimeChange={setWakeTime}
        />

        {/* Buffer Zone — linked to current time */}
        <div className="mt-4 px-3 py-2.5 bg-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Buffer Zone</h3>
                <p className="text-[10px] text-muted-foreground">Time until bedtime</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                value={[Math.min(bufferMinutes, 180)]}
                onValueChange={(v) => setBufferMinutes(v[0])}
                min={0}
                max={180}
                step={5}
                className="w-20"
              />
              <span className="text-lg font-bold text-primary min-w-[56px] text-right">
                {bufferDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Sleep Alarm */}
        <div className="mt-2 px-3 py-2.5 bg-muted/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Sleep Alarm</h3>
            </div>
            <button
              onClick={toggleAlarm}
              className={`w-12 h-7 rounded-full transition-colors duration-300 ${
                alarmEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <motion.div
                className="w-5 h-5 bg-white rounded-full shadow-lg"
                animate={{ x: alarmEnabled ? 22 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </div>

        {/* Sync Ritual */}
        <div className="mt-3">
          <motion.button
            onClick={handleSync}
            disabled={syncing || synced}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              synced
                ? "bg-sleep-success/20 text-sleep-success"
                : syncing
                ? "bg-primary/20 text-primary"
                : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg hover:shadow-primary/30"
            }`}
            whileTap={{ scale: 0.97 }}
          >
            {syncing ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Syncing to device...
              </>
            ) : synced ? (
              <>
                <Check className="w-5 h-5" />
                Synced · Bedtime {bedtime}
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                Commit & Activate
              </>
            )}
          </motion.button>

          {/* Reset button — visible when activated */}
          {activatedAt && !syncing && (
            <motion.button
              onClick={async () => {
                await resetActivation();
                await resetTodayLog();
                setSynced(false);
              }}
              className="w-full mt-2 py-3 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-destructive/30 text-destructive hover:bg-destructive/10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Plan
            </motion.button>
          )}

          <AnimatePresence>
            {synced && (
              <motion.div
                className="mt-3 p-3 bg-muted/30 rounded-xl"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-xs text-center text-muted-foreground">
                  🚀 Plan synced · {bufferDisplay} buffer · Bedtime {bedtime}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 2. Brain Dump / Worry Box */}
      <motion.div
        className="glass-card p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-primary" />
          Worry Box
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Toss your worries in here — your sprite will hold onto them. Clear your mind and sleep 🧹
        </p>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={worryInput}
              onChange={(e) => setWorryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWorry()}
              placeholder="Write down your worry..."
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <button
            onClick={handleAddWorry}
            disabled={!worryInput.trim()}
            className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors disabled:opacity-30"
          >
            <Send className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {worries.map((worry) => (
            <motion.div
              key={worry.id}
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={
                worry.absorbed
                  ? { opacity: 0, scale: 0.2, y: -30, x: 100 }
                  : { opacity: 1, scale: 1, y: 0 }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeIn" }}
              className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl mb-2"
            >
              <motion.div
                className="w-3 h-3 rounded-full bg-primary"
                animate={worry.absorbed ? { scale: [1, 1.5, 0] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
              />
              <span className="text-sm text-foreground">{worry.text}</span>
              {worry.absorbed && (
                <motion.span
                  className="ml-auto text-xs text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ✨ Added to tomorrow's list
                </motion.span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {worries.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">
              🧠 Mind cleared, ready to sleep
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PlanPage;
