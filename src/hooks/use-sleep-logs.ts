import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateDeviceId } from "@/lib/deviceId";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export interface SleepLog {
  date: string;
  quality: number;
  collected: boolean;
  timed_out: boolean;
  bedtime_planned: string;
  wake_time_planned: string;
}

export function useSleepLogs() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [todayLog, setTodayLog] = useState<SleepLog | null>(null);
  const deviceId = useRef(getOrCreateDeviceId());

  // Load logs for current month
  const loadLogs = useCallback(async (year: number, month: number) => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const { data } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("device_id", deviceId.current)
      .gte("date", startDate)
      .lte("date", endDate);

    if (data) {
      setLogs(data.map((d: any) => ({
        date: d.date,
        quality: d.quality,
        collected: d.collected,
        timed_out: d.timed_out,
        bedtime_planned: d.bedtime_planned,
        wake_time_planned: d.wake_time_planned,
      })));
    }
  }, []);

  // Load today's log
  const loadTodayLog = useCallback(async () => {
    const today = getTodayDate();
    const { data } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("device_id", deviceId.current)
      .eq("date", today)
      .maybeSingle();

    if (data) {
      setTodayLog({
        date: data.date,
        quality: data.quality,
        collected: data.collected,
        timed_out: data.timed_out,
        bedtime_planned: data.bedtime_planned,
        wake_time_planned: data.wake_time_planned,
      });
    } else {
      setTodayLog(null);
    }
  }, []);

  // Check if today's mug is already done (collected or timed out)
  const isTodayDone = todayLog?.collected || todayLog?.timed_out || false;

  // Collect today's cozy mug reward
  const collectToday = useCallback(async (fillPercent: number, bedtime: string, wakeTime: string) => {
    const today = getTodayDate();
    // Quality = fill percent at collection time
    const quality = Math.max(1, fillPercent);

    await supabase
      .from("sleep_logs")
      .upsert({
        device_id: deviceId.current,
        date: today,
        quality,
        collected: true,
        timed_out: false,
        bedtime_planned: bedtime,
        wake_time_planned: wakeTime,
      } as any, { onConflict: "device_id,date" });

    setTodayLog({
      date: today,
      quality,
      collected: true,
      timed_out: false,
      bedtime_planned: bedtime,
      wake_time_planned: wakeTime,
    });
  }, []);

  // Mark today as timed out (10 min past bedtime, not collected)
  const timeoutToday = useCallback(async (bedtime: string, wakeTime: string) => {
    const today = getTodayDate();

    await supabase
      .from("sleep_logs")
      .upsert({
        device_id: deviceId.current,
        date: today,
        quality: 0,
        collected: false,
        timed_out: true,
        bedtime_planned: bedtime,
        wake_time_planned: wakeTime,
      } as any, { onConflict: "device_id,date" });

    setTodayLog({
      date: today,
      quality: 0,
      collected: false,
      timed_out: true,
      bedtime_planned: bedtime,
      wake_time_planned: wakeTime,
    });
  }, []);

  // Auto-fill yesterday's log if there was an activation but no log
  const autoFillYesterday = useCallback(async (bedtime: string, wakeTime: string) => {
    const yesterday = getYesterdayDate();
    const { data } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("device_id", deviceId.current)
      .eq("date", yesterday)
      .maybeSingle();

    if (!data) {
      // Check if there was an activation yesterday by looking at sleep_plans activated_at
      const { data: plan } = await supabase
        .from("sleep_plans")
        .select("*")
        .eq("device_id", deviceId.current)
        .maybeSingle();

      if (plan?.activated_at) {
        const activatedDate = new Date(plan.activated_at).toISOString().split("T")[0];
        if (activatedDate === yesterday) {
          // Was activated yesterday but not collected → poor quality
          await supabase
            .from("sleep_logs")
            .upsert({
              device_id: deviceId.current,
              date: yesterday,
              quality: 30, // poor - activated but didn't collect
              collected: false,
              timed_out: true,
              bedtime_planned: plan.bedtime,
              wake_time_planned: plan.wake_time,
            } as any, { onConflict: "device_id,date" });
        }
      }
    }
  }, []);

  // On mount: load today's log and auto-fill yesterday
  useEffect(() => {
    loadTodayLog();
  }, [loadTodayLog]);

  // Get yesterday's quality (for sprite glow)
  const getYesterdayQuality = useCallback(async (): Promise<number | null> => {
    const yesterday = getYesterdayDate();
    const { data } = await supabase
      .from("sleep_logs")
      .select("quality")
      .eq("device_id", deviceId.current)
      .eq("date", yesterday)
      .maybeSingle();
    return data?.quality ?? null;
  }, []);

  // Reset today's log so mug can be re-collected after plan reset
  const resetTodayLog = useCallback(async () => {
    const today = getTodayDate();
    await supabase
      .from("sleep_logs")
      .delete()
      .eq("device_id", deviceId.current)
      .eq("date", today);
    setTodayLog(null);
  }, []);

  return {
    logs,
    todayLog,
    isTodayDone,
    loadLogs,
    collectToday,
    timeoutToday,
    autoFillYesterday,
    getYesterdayQuality,
    resetTodayLog,
  };
}
