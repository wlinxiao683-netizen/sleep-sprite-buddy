import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// UUID polyfill — crypto.randomUUID is only available in secure contexts
// ---------------------------------------------------------------------------
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getDeviceId(): string {
  let id = localStorage.getItem("sleepwell_device_id");
  if (!id) {
    id = generateUUID();
    localStorage.setItem("sleepwell_device_id", id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const LS_LOGS_KEY = "sleepwell_logs_v2";

export interface SleepLog {
  date: string;
  quality: number;
  collected: boolean;
  timed_out: boolean;
  bedtime_planned: string;
  wake_time_planned: string;
}

function loadAllLocalLogs(): SleepLog[] {
  try {
    const raw = localStorage.getItem(LS_LOGS_KEY);
    return raw ? (JSON.parse(raw) as SleepLog[]) : [];
  } catch {
    return [];
  }
}

function saveAllLocalLogs(logs: SleepLog[]) {
  localStorage.setItem(LS_LOGS_KEY, JSON.stringify(logs));
}

function upsertLocalLog(log: SleepLog) {
  const all = loadAllLocalLogs();
  const idx = all.findIndex((l) => l.date === log.date);
  if (idx >= 0) all[idx] = log;
  else all.push(log);
  saveAllLocalLogs(all);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSleepLogs() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [todayLog, setTodayLog] = useState<SleepLog | null>(null);
  const deviceId = useRef(getDeviceId());

  const loadLogs = useCallback(async (year: number, month: number) => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate   = `${year}-${String(month).padStart(2, "0")}-31`;

    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("sleep_logs")
        .select("*")
        .eq("device_id", deviceId.current)
        .gte("date", startDate)
        .lte("date", endDate);

      if (data) {
        setLogs(
          data.map((d: any) => ({
            date: d.date,
            quality: d.quality,
            collected: d.collected,
            timed_out: d.timed_out,
            bedtime_planned: d.bedtime_planned,
            wake_time_planned: d.wake_time_planned,
          }))
        );
      }
    } else {
      const all = loadAllLocalLogs();
      setLogs(all.filter((l) => l.date >= startDate && l.date <= endDate));
    }
  }, []);

  const loadTodayLog = useCallback(async () => {
    const today = getTodayDate();
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("sleep_logs")
        .select("*")
        .eq("device_id", deviceId.current)
        .eq("date", today)
        .maybeSingle();

      setTodayLog(
        data
          ? {
              date: data.date,
              quality: data.quality,
              collected: data.collected,
              timed_out: data.timed_out,
              bedtime_planned: data.bedtime_planned,
              wake_time_planned: data.wake_time_planned,
            }
          : null
      );
    } else {
      const all = loadAllLocalLogs();
      setTodayLog(all.find((l) => l.date === today) ?? null);
    }
  }, []);

  const isTodayDone = todayLog?.collected || todayLog?.timed_out || false;

  const collectToday = useCallback(
    async (fillPercent: number, bedtime: string, wakeTime: string) => {
      const today = getTodayDate();
      const quality = Math.max(1, fillPercent);
      const log: SleepLog = {
        date: today,
        quality,
        collected: true,
        timed_out: false,
        bedtime_planned: bedtime,
        wake_time_planned: wakeTime,
      };
      if (isSupabaseConfigured) {
        await supabase
          .from("sleep_logs")
          .upsert(
            { device_id: deviceId.current, ...log } as any,
            { onConflict: "device_id,date" }
          );
      } else {
        upsertLocalLog(log);
      }
      setTodayLog(log);
    },
    []
  );

  const timeoutToday = useCallback(
    async (bedtime: string, wakeTime: string) => {
      const today = getTodayDate();
      const log: SleepLog = {
        date: today,
        quality: 0,
        collected: false,
        timed_out: true,
        bedtime_planned: bedtime,
        wake_time_planned: wakeTime,
      };
      if (isSupabaseConfigured) {
        await supabase
          .from("sleep_logs")
          .upsert(
            { device_id: deviceId.current, ...log } as any,
            { onConflict: "device_id,date" }
          );
      } else {
        upsertLocalLog(log);
      }
      setTodayLog(log);
    },
    []
  );

  const autoFillYesterday = useCallback(
    async (bedtime: string, wakeTime: string) => {
      const yesterday = getYesterdayDate();

      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from("sleep_logs")
          .select("*")
          .eq("device_id", deviceId.current)
          .eq("date", yesterday)
          .maybeSingle();

        if (!data) {
          const { data: plan } = await supabase
            .from("sleep_plans")
            .select("*")
            .eq("device_id", deviceId.current)
            .maybeSingle();

          if (plan?.activated_at) {
            const activatedDate = new Date(plan.activated_at).toISOString().split("T")[0];
            if (activatedDate === yesterday) {
              await supabase
                .from("sleep_logs")
                .upsert(
                  {
                    device_id: deviceId.current,
                    date: yesterday,
                    quality: 30,
                    collected: false,
                    timed_out: true,
                    bedtime_planned: plan.bedtime,
                    wake_time_planned: plan.wake_time,
                  } as any,
                  { onConflict: "device_id,date" }
                );
            }
          }
        }
      } else {
        const all = loadAllLocalLogs();
        if (!all.find((l) => l.date === yesterday)) {
          // Check if the plan was activated yesterday
          try {
            const planRaw = localStorage.getItem("sleepwell_plan_v2");
            if (planRaw) {
              const plan = JSON.parse(planRaw);
              if (plan?.activated_at) {
                const activatedDate = new Date(plan.activated_at).toISOString().split("T")[0];
                if (activatedDate === yesterday) {
                  upsertLocalLog({
                    date: yesterday,
                    quality: 30,
                    collected: false,
                    timed_out: true,
                    bedtime_planned: plan.bedtime ?? bedtime,
                    wake_time_planned: plan.wake_time ?? wakeTime,
                  });
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }
    },
    []
  );

  const getYesterdayQuality = useCallback(async (): Promise<number | null> => {
    const yesterday = getYesterdayDate();
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from("sleep_logs")
        .select("quality")
        .eq("device_id", deviceId.current)
        .eq("date", yesterday)
        .maybeSingle();
      return data?.quality ?? null;
    } else {
      const all = loadAllLocalLogs();
      return all.find((l) => l.date === yesterday)?.quality ?? null;
    }
  }, []);

  const resetTodayLog = useCallback(async () => {
    const today = getTodayDate();
    if (isSupabaseConfigured) {
      await supabase
        .from("sleep_logs")
        .delete()
        .eq("device_id", deviceId.current)
        .eq("date", today);
    } else {
      const all = loadAllLocalLogs().filter((l) => l.date !== today);
      saveAllLocalLogs(all);
    }
    setTodayLog(null);
  }, []);

  useEffect(() => {
    loadTodayLog();
  }, [loadTodayLog]);

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
