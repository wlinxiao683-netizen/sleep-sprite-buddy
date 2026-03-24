import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar as CalendarIcon,
  Moon,
  Heart,
  Clock,
  Star,
  Zap,
  Activity,
  BatteryMedium,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useSleepLogs } from "@/hooks/use-sleep-logs";

const moodEmojis = ["😴", "😊", "😐", "😣", "🌟"];

/** Demo data when DB has few/no logs — real logs override per-day where present */
const MOCK_MARCH_2026_QUALITY: Record<number, number> = {
  1: 78, 2: 82, 3: 71, 4: 0, 5: 88, 6: 91, 7: 76,
  8: 84, 9: 79, 10: 86, 11: 73, 12: 90, 13: 68, 14: 81,
  15: 77, 16: 89, 17: 72, 18: 85, 19: 92, 20: 80, 21: 74,
  22: 87, 23: 83, 24: 0, 25: 88, 26: 79, 27: 91, 28: 86,
  29: 75, 30: 84, 31: 82,
};

const MOCK_WEEK_DATA = [
  { day: "Mon", quality: 82, hours: 7.5 },
  { day: "Tue", quality: 76, hours: 6.9 },
  { day: "Wed", quality: 88, hours: 8.0 },
  { day: "Thu", quality: 91, hours: 8.2 },
  { day: "Fri", quality: 74, hours: 6.8 },
  { day: "Sat", quality: 85, hours: 7.9 },
  { day: "Sun", quality: 89, hours: 8.1 },
];

const MOCK_SLEEP_DEBT = {
  targetHours: 56,
  actualHours: 52.5,
  debtHours: 3.5,
  energyPercent: 72,
  dailyBreakdown: [
    { day: "Mon", diff: 0.3 },
    { day: "Tue", diff: -0.8 },
    { day: "Wed", diff: 0.5 },
    { day: "Thu", diff: 0.2 },
    { day: "Fri", diff: -1.1 },
    { day: "Sat", diff: 0.6 },
    { day: "Sun", diff: -0.4 },
  ],
};

const MOCK_YESTERDAY_DETAIL = {
  totalHours: 7.4,
  quality: 84,
  rating: "Good" as const,
  bedtime: "23:18",
  wakeTime: "06:42",
  heartRate: { avg: 58, min: 48, max: 76 },
  cycles: [
    { type: "Light", duration: 2, color: "bg-primary/40" },
    { type: "Deep", duration: 2.5, color: "bg-primary" },
    { type: "REM", duration: 1.5, color: "bg-purple-400" },
    { type: "Light", duration: 1.8, color: "bg-primary/40" },
    { type: "REM", duration: 1.2, color: "bg-purple-400" },
  ],
};

const getMoodForDay = (quality: number) => {
  if (quality === 0) return { emoji: "", mood: "none" };
  if (quality >= 90) return { emoji: "🌟", mood: "amazing" };
  if (quality >= 80) return { emoji: "😊", mood: "good" };
  if (quality >= 60) return { emoji: "😐", mood: "okay" };
  return { emoji: "😣", mood: "poor" };
};

type WeekRow = (typeof MOCK_WEEK_DATA)[number];

/** Local template “AI” — no API; wording follows chart + sleep-debt numbers on this page */
function buildLocalAiInsights(input: {
  avgQuality: number;
  avgHours: number;
  weekData: WeekRow[];
  debtHours: number;
  energyPercent: number;
}): { weekText: string; nextWeek: string[] } {
  const { avgQuality, avgHours, weekData, debtHours, energyPercent } = input;
  const worst = weekData.reduce((a, b) => (a.quality <= b.quality ? a : b));
  const best = weekData.reduce((a, b) => (a.quality >= b.quality ? a : b));
  const light =
    avgQuality >= 84
      ? "Your week has a bright, steady arc — quality stays in a healthy band."
      : avgQuality >= 75
        ? "You’re in a good range overall, with a few edges to smooth."
        : "There’s a clear signal to protect recovery a bit more next week.";

  const weekText = `${light} Averaging about ${avgQuality}% quality and ${avgHours.toFixed(1)}h sleep per night, sprite energy sits near ${energyPercent}%. You’re carrying roughly ${debtHours}h sleep debt versus target — ${best.day} looked strongest (${best.quality}%), while ${worst.day} asked for a gentler landing (${worst.quality}%).`;

  const nextWeek = [
    worst.quality < 78
      ? `Give ${worst.day} a 15–20 minute earlier wind-down — keep screens away for the first few minutes in bed.`
      : `Keep ${best.day}’s bedtime rhythm as your “anchor” and copy it to one other weekday.`,
    debtHours >= 3
      ? `Next week, add one 25-minute sleep window (or nap) on a lighter day to chip away at the ${debtHours}h gap — no guilt, just consistency.`
      : `Hold wake time within ~30 minutes every day — small drift beats big swings for next week’s curve.`,
    `Plan one calm evening (stretch, dim light, same room temperature) before your busiest day — it’s the cheapest upgrade for your score.`,
  ];

  return { weekText, nextWeek };
}

const InsightsPage = () => {
  const [currentMonth, setCurrentMonth] = useState("March 2026");
  const [aiInsights, setAiInsights] = useState<{
    weekText: string;
    nextWeek: string[];
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { logs, loadLogs } = useSleepLogs();

  // Load March 2026 logs on mount
  useEffect(() => {
    loadLogs(2026, 3);
  }, [loadLogs]);

  // Demo calendar + real logs (same month) override per day
  const logsByDay = useMemo(() => {
    const map: Record<number, number> = { ...MOCK_MARCH_2026_QUALITY };
    logs.forEach((log) => {
      const dayNum = parseInt(log.date.split("-")[2], 10);
      map[dayNum] = log.quality;
    });
    return map;
  }, [logs]);

  const weekData = MOCK_WEEK_DATA;

  const weekSummary = useMemo(() => {
    const q = MOCK_WEEK_DATA.reduce((a, b) => a + b.quality, 0) / MOCK_WEEK_DATA.length;
    const h = MOCK_WEEK_DATA.reduce((a, b) => a + b.hours, 0) / MOCK_WEEK_DATA.length;
    return { avgQuality: Math.round(q), avgHours: h.toFixed(1) };
  }, []);

  // March 2026 starts on Sunday → offset 6 for Mon-start grid
  const marchDaysInMonth = 31;
  const marchStartOffset = 6; // Sunday = 6 empty cells when week starts Monday
  const calendarDays: { day: number; quality: number }[] = [];
  for (let i = 0; i < marchStartOffset; i++) {
    calendarDays.push({ day: 0, quality: 0 });
  }
  for (let d = 1; d <= marchDaysInMonth; d++) {
    calendarDays.push({ day: d, quality: logsByDay[d] || 0 });
  }

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const yesterdayLog = logs.find((l) => l.date === yesterdayKey);

  const yesterdaySleep = useMemo(() => {
    const m = MOCK_YESTERDAY_DETAIL;
    if (!yesterdayLog) {
      return {
        totalHours: m.totalHours,
        quality: m.quality,
        rating: m.rating,
        bedtime: m.bedtime,
        wakeTime: m.wakeTime,
        heartRate: m.heartRate,
        cycles: m.cycles,
      };
    }
    const q = yesterdayLog.quality;
    return {
      totalHours: m.totalHours,
      quality: q,
      rating: q >= 90 ? "Excellent" : q >= 70 ? "Good" : q >= 50 ? "Fair" : "Poor",
      bedtime: yesterdayLog.bedtime_planned,
      wakeTime: yesterdayLog.wake_time_planned,
      heartRate: m.heartRate,
      cycles: m.cycles,
    };
  }, [yesterdayLog]);

  const sleepDebtData = MOCK_SLEEP_DEBT;

  const runLocalAiInsights = () => {
    setAiLoading(true);
    window.setTimeout(() => {
      setAiInsights(
        buildLocalAiInsights({
          avgQuality: weekSummary.avgQuality,
          avgHours: Number.parseFloat(weekSummary.avgHours),
          weekData: MOCK_WEEK_DATA,
          debtHours: sleepDebtData.debtHours,
          energyPercent: sleepDebtData.energyPercent,
        })
      );
      setAiLoading(false);
    }, 650);
  };

  const getQualityColor = (quality: number) => {
    if (quality === 0) return "bg-muted/30";
    if (quality >= 80) return "bg-primary/20";
    if (quality >= 60) return "bg-primary/10";
    return "bg-muted/20";
  };

  const getRatingColor = (rating: string) => {
    if (rating === "Excellent") return "text-sleep-success";
    if (rating === "Good") return "text-green-400";
    if (rating === "Fair") return "text-yellow-400";
    if (rating === "No Data") return "text-muted-foreground";
    return "text-orange-400";
  };

  return (
    <div className="min-h-screen pb-24 px-6">
      {/* Header */}
      <motion.div
        className="pt-8 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          Insights
        </h1>
        <p className="text-muted-foreground">Understand your sleep patterns</p>
      </motion.div>

      {/* Mood Calendar */}
      <motion.div
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <button className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-semibold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            {currentMonth}
          </span>
          <button className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid with mood sprites */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (day.day === 0) {
              return <div key={index} className="aspect-square" />;
            }
            const mood = getMoodForDay(day.quality);
            return (
              <motion.div
                key={index}
                className={`aspect-square rounded-lg ${getQualityColor(day.quality)} flex flex-col items-center justify-center gap-0.5 relative`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.01 }}
              >
                {mood.emoji && (
                  <span className="text-sm leading-none">{mood.emoji}</span>
                )}
                <span className={`text-[10px] ${day.quality > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                  {day.day}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Mood Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-1">
            <span className="text-sm">😣</span>
            <span className="text-xs text-muted-foreground">Poor</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">😐</span>
            <span className="text-xs text-muted-foreground">Okay</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">😊</span>
            <span className="text-xs text-muted-foreground">Good</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">🌟</span>
            <span className="text-xs text-muted-foreground">Amazing</span>
          </div>
        </div>
      </motion.div>

      {/* Sleep Debt Visualization */}
      <motion.div
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <BatteryMedium className="w-4 h-4 text-primary" />
          Sleep Debt
        </h3>

        {/* Energy Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Sprite Energy</span>
            <span className="text-sm font-semibold text-foreground">{sleepDebtData.energyPercent}%</span>
          </div>
          <div className="h-4 rounded-full bg-muted/30 overflow-hidden relative">
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                background: sleepDebtData.energyPercent > 60
                  ? "linear-gradient(90deg, hsl(var(--primary)), hsl(142 71% 45%))"
                  : sleepDebtData.energyPercent > 30
                  ? "linear-gradient(90deg, hsl(45 93% 47%), hsl(var(--primary)))"
                  : "linear-gradient(90deg, hsl(0 84% 60%), hsl(45 93% 47%))",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${sleepDebtData.energyPercent}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Debt Summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-xl bg-muted/30">
            <p className="text-lg font-bold text-foreground">{sleepDebtData.targetHours}h</p>
            <p className="text-[10px] text-muted-foreground">Target</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-muted/30">
            <p className="text-lg font-bold text-foreground">{sleepDebtData.actualHours}h</p>
            <p className="text-[10px] text-muted-foreground">Actual</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-lg font-bold text-red-400">-{sleepDebtData.debtHours}h</p>
            <p className="text-[10px] text-muted-foreground">Debt</p>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="flex items-end justify-between gap-1 h-20">
          {sleepDebtData.dailyBreakdown.map((d, i) => {
            const isPositive = d.diff >= 0;
            const height = Math.abs(d.diff) * 20 + 4;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className={`w-full rounded-t-md ${isPositive ? "bg-green-400/60" : "bg-red-400/60"}`}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                />
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-green-400/60" />
            <span className="text-xs text-muted-foreground">Surplus</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-red-400/60" />
            <span className="text-xs text-muted-foreground">Deficit</span>
          </div>
        </div>
      </motion.div>

      {/* Yesterday's Sleep Details */}
      <motion.div
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" />
            Yesterday's Sleep
          </h3>
          <span className={`text-sm font-semibold ${getRatingColor(yesterdaySleep.rating)}`}>
            {yesterdaySleep.rating}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{yesterdaySleep.totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total Sleep</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <p className="text-2xl font-bold text-foreground">{yesterdaySleep.quality}%</p>
            <p className="text-xs text-muted-foreground">Quality</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30">
            <div className="flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.min(5, Math.max(1, Math.round(yesterdaySleep.quality / 20)))
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rating</p>
          </div>
        </div>

        {/* Sleep Cycles */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            Sleep Cycles
          </p>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {yesterdaySleep.cycles.map((cycle, index) => (
              <motion.div
                key={index}
                className={`${cycle.color} relative group`}
                style={{ flex: cycle.duration }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-foreground font-medium">{cycle.type}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>23:15</span>
            <span>02:00</span>
            <span>04:00</span>
            <span>06:45</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-orange-400" />
            <span className="text-xs text-muted-foreground">Awake</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-primary/40" />
            <span className="text-xs text-muted-foreground">Light</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">Deep</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-purple-400" />
            <span className="text-xs text-muted-foreground">REM</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bedtime</p>
              <p className="text-sm font-semibold text-foreground">{yesterdaySleep.bedtime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wake Time</p>
              <p className="text-sm font-semibold text-foreground">{yesterdaySleep.wakeTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 col-span-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Heart Rate</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-foreground">Avg {yesterdaySleep.heartRate.avg} bpm</p>
                <span className="text-xs text-muted-foreground">
                  Min {yesterdaySleep.heartRate.min} · Max {yesterdaySleep.heartRate.max}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Sleep Quality Chart */}
      <motion.div
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Weekly Sleep Quality
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekData}>
              <defs>
                <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265 89% 66%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(265 89% 66%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(240 10% 60%)', fontSize: 12 }}
              />
              <YAxis hide domain={[50, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(240 20% 10%)',
                  border: '1px solid hsl(240 20% 20%)',
                  borderRadius: '12px',
                  color: 'hsl(240 10% 95%)',
                }}
                labelStyle={{ color: 'hsl(240 10% 60%)' }}
              />
              <Area
                type="monotone"
                dataKey="quality"
                stroke="hsl(265 89% 66%)"
                strokeWidth={2}
                fill="url(#qualityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Sleep Quality</p>
            <p className="text-xl font-bold text-foreground">{weekSummary.avgQuality}%</p>
            <div className="flex items-center gap-1 mt-1 text-sleep-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">+5% vs last week</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Sleep Time</p>
            <p className="text-xl font-bold text-foreground">{weekSummary.avgHours}h</p>
            <div className="flex items-center gap-1 mt-1 text-sleep-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">+0.5h vs last week</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Local AI-style insights (template, no API) */}
      <motion.div
        className="glass-card p-4 mb-6 overflow-hidden border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-transparent to-accent/[0.08]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">AI insight</h3>
            <p className="text-xs text-muted-foreground leading-snug">
              Short read on this week and one bright plan for next — generated from the numbers above (on-device template, not a live model).
            </p>
          </div>
        </div>

        {!aiInsights && (
          <div className="rounded-xl border border-dashed border-primary/30 bg-background/40 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Tap generate to weave your weekly quality, hours, and sleep debt into a quick takeaway.
            </p>
            <Button
              type="button"
              className="rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90"
              disabled={aiLoading}
              onClick={runLocalAiInsights}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        )}

        {aiInsights && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary mb-2">
                This week
              </p>
              <p className="text-sm leading-relaxed text-foreground/95">{aiInsights.weekText}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-accent mb-2">
                Next week
              </p>
              <ul className="space-y-2">
                {aiInsights.nextWeek.map((line, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-snug text-foreground/95">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-xl"
              disabled={aiLoading}
              onClick={runLocalAiInsights}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating…
                </>
              ) : (
                "Regenerate"
              )}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default InsightsPage;
