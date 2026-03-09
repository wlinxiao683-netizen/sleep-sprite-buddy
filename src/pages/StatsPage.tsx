import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Lightbulb, ChevronLeft, ChevronRight, TrendingUp, Calendar as CalendarIcon, Moon, Heart, Clock, Star, Zap, Activity, Gamepad2, Smartphone, Brain, BatteryMedium } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useSleepLogs } from "@/hooks/use-sleep-logs";

const moodEmojis = ["😴", "😊", "😐", "😣", "🌟"];

const getMoodForDay = (quality: number) => {
  if (quality === 0) return { emoji: "", mood: "none" };
  if (quality >= 90) return { emoji: "🌟", mood: "amazing" };
  if (quality >= 80) return { emoji: "😊", mood: "good" };
  if (quality >= 60) return { emoji: "😐", mood: "okay" };
  return { emoji: "😣", mood: "poor" };
};

const InsightsPage = () => {
  const [currentMonth, setCurrentMonth] = useState("March 2026");
  const { logs, loadLogs } = useSleepLogs();

  // Load March 2026 logs on mount
  useEffect(() => {
    loadLogs(2026, 3);
  }, [loadLogs]);

  // Build a map of day → quality from logs
  const logsByDay = useMemo(() => {
    const map: Record<number, number> = {};
    logs.forEach((log) => {
      const dayNum = parseInt(log.date.split("-")[2], 10);
      map[dayNum] = log.quality;
    });
    return map;
  }, [logs]);

  const weekData = [
    { day: "Mon", quality: 0, hours: 0 },
    { day: "Tue", quality: 0, hours: 0 },
    { day: "Wed", quality: 0, hours: 0 },
    { day: "Thu", quality: 0, hours: 0 },
    { day: "Fri", quality: 0, hours: 0 },
    { day: "Sat", quality: 0, hours: 0 },
    { day: "Sun", quality: 0, hours: 0 },
  ];

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

  // Find yesterday's log for details
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDay = yesterdayDate.getDate();
  const yesterdayLog = logs.find((l) => parseInt(l.date.split("-")[2], 10) === yesterdayDay);

  const yesterdaySleep = yesterdayLog ? {
    totalHours: 0, // We don't track actual hours yet
    quality: yesterdayLog.quality,
    rating: yesterdayLog.quality >= 90 ? "Excellent" : yesterdayLog.quality >= 70 ? "Good" : yesterdayLog.quality >= 50 ? "Fair" : "Poor",
    bedtime: yesterdayLog.bedtime_planned,
    wakeTime: yesterdayLog.wake_time_planned,
    heartRate: { avg: 0, min: 0, max: 0 },
    cycles: [] as { type: string; duration: number; color: string }[],
  } : {
    totalHours: 0,
    quality: 0,
    rating: "No Data",
    bedtime: "--:--",
    wakeTime: "--:--",
    heartRate: { avg: 0, min: 0, max: 0 },
    cycles: [] as { type: string; duration: number; color: string }[],
  };

  const behaviorTags = [
    {
      icon: "🎮",
      type: "Intentional",
      count: 3,
      color: "bg-purple-500/20 border-purple-500/30",
      textColor: "text-purple-700 dark:text-purple-300",
      message: "You stored too much fun in the evenings this week.",
    },
    {
      icon: "📱",
      type: "Mindless",
      count: 1,
      color: "bg-blue-500/20 border-blue-500/30",
      textColor: "text-blue-700 dark:text-blue-300",
      message: "Tuesday night your phone stole 1 hour from you.",
    },
    {
      icon: "😟",
      type: "Anxious",
      count: 0,
      color: "bg-green-500/20 border-green-500/30",
      textColor: "text-green-700 dark:text-green-300",
      message: "Pre-sleep anxiety was well managed this week!",
    },
  ];

  // Sleep debt: target 8h/night, 7 days
  const sleepDebtData = {
    targetHours: 0,
    actualHours: 0,
    debtHours: 0,
    energyPercent: 0,
    dailyBreakdown: [
      { day: "Mon", diff: 0 },
      { day: "Tue", diff: 0 },
      { day: "Wed", diff: 0 },
      { day: "Thu", diff: 0 },
      { day: "Fri", diff: 0 },
      { day: "Sat", diff: 0 },
      { day: "Sun", diff: 0 },
    ],
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

      {/* Behavior Attribution */}
      <motion.div
        className="glass-card p-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Behavior Attribution
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Why you stayed up late this week
        </p>

        <div className="space-y-3">
          {behaviorTags.map((tag, index) => (
            <motion.div
              key={tag.type}
              className={`p-3 rounded-xl border ${tag.color}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tag.icon}</span>
                  <span className={`text-sm font-semibold ${tag.textColor}`}>
                    {tag.type}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tag.color} ${tag.textColor}`}>
                  {tag.count} {tag.count === 1 ? "time" : "times"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{tag.message}</p>
            </motion.div>
          ))}
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
                  className={`w-4 h-4 ${star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
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
            <p className="text-xl font-bold text-foreground">81%</p>
            <div className="flex items-center gap-1 mt-1 text-sleep-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">+5% vs last week</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Sleep Time</p>
            <p className="text-xl font-bold text-foreground">7.8h</p>
            <div className="flex items-center gap-1 mt-1 text-sleep-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs">+0.5h vs last week</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InsightsPage;
