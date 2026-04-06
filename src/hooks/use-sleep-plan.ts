import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// UUID polyfill — crypto.randomUUID is only available in secure contexts
// (HTTPS / localhost). Fall back to a manual RFC-4122 v4 generator.
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
// localStorage helpers (used when Supabase is not configured)
// ---------------------------------------------------------------------------
const LS_PLAN_KEY = "sleepwell_plan_v2";

interface LocalPlan {
  bedtime: string;
  wake_time: string;
  buffer_minutes: number;
  alarm_enabled: boolean;
  activated_at: string | null;
}

function loadLocalPlan(): LocalPlan | null {
  try {
    const raw = localStorage.getItem(LS_PLAN_KEY);
    return raw ? (JSON.parse(raw) as LocalPlan) : null;
  } catch {
    return null;
  }
}

function saveLocalPlan(plan: LocalPlan) {
  localStorage.setItem(LS_PLAN_KEY, JSON.stringify(plan));
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------
function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function calcBuffer(bedtime: string): number {
  const nowMins = getCurrentMinutes();
  const bedMins = timeToMinutes(bedtime);
  let diff = bedMins - nowMins;
  if (diff < 0) diff += 1440;
  if (diff > 720) return 0;
  return Math.min(diff, 360);
}

function calcBedtime(bufferMinutes: number): string {
  const nowMins = getCurrentMinutes();
  return minutesToTime(nowMins + bufferMinutes);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSleepPlan() {
  const [bedtime, setBedtimeState] = useState("23:00");
  const [wakeTime, setWakeTimeState] = useState("07:00");
  const [bufferMinutes, setBufferState] = useState(15);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hasSleepPlanRow, setHasSleepPlanRow] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const deviceId = useRef(getDeviceId());

  // Load on mount
  useEffect(() => {
    (async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from("sleep_plans")
          .select("*")
          .eq("device_id", deviceId.current)
          .maybeSingle();

        if (data) {
          setHasSleepPlanRow(true);
          setBedtimeState(data.bedtime);
          setWakeTimeState(data.wake_time);
          setBufferState(data.buffer_minutes);
          setAlarmEnabled(data.alarm_enabled);
          setActivatedAt((data as any).activated_at ?? null);
        } else {
          setBufferState(calcBuffer("23:00"));
        }
      } else {
        // Offline: read from localStorage
        const local = loadLocalPlan();
        if (local) {
          setHasSleepPlanRow(true);
          setBedtimeState(local.bedtime);
          setWakeTimeState(local.wake_time);
          setBufferState(local.buffer_minutes);
          setAlarmEnabled(local.alarm_enabled);
          setActivatedAt(local.activated_at);
        } else {
          setBufferState(calcBuffer("23:00"));
        }
      }
      setLoaded(true);
    })();
  }, []);

  // Debounced save
  const saveToDB = useCallback(
    (bed: string, wake: string, buffer: number, alarm: boolean, activAt?: string | null) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from("sleep_plans")
            .upsert(
              {
                device_id: deviceId.current,
                bedtime: bed,
                wake_time: wake,
                buffer_minutes: buffer,
                alarm_enabled: alarm,
              },
              { onConflict: "device_id" }
            );
          if (!error) setHasSleepPlanRow(true);
        } else {
          saveLocalPlan({
            bedtime: bed,
            wake_time: wake,
            buffer_minutes: buffer,
            alarm_enabled: alarm,
            activated_at: activAt !== undefined ? activAt : activatedAt,
          });
          setHasSleepPlanRow(true);
        }
      }, 500);
    },
    [activatedAt]
  );

  const setBedtime = useCallback(
    (newBedtime: string) => {
      setBedtimeState(newBedtime);
      const newBuffer = calcBuffer(newBedtime);
      setBufferState(newBuffer);
      saveToDB(newBedtime, wakeTime, newBuffer, alarmEnabled);
    },
    [wakeTime, alarmEnabled, saveToDB]
  );

  const setWakeTime = useCallback(
    (newWake: string) => {
      setWakeTimeState(newWake);
      saveToDB(bedtime, newWake, bufferMinutes, alarmEnabled);
    },
    [bedtime, bufferMinutes, alarmEnabled, saveToDB]
  );

  const setBufferMinutes = useCallback(
    (newBuffer: number) => {
      setBufferState(newBuffer);
      const newBedtime = calcBedtime(newBuffer);
      setBedtimeState(newBedtime);
      saveToDB(newBedtime, wakeTime, newBuffer, alarmEnabled);
    },
    [wakeTime, alarmEnabled, saveToDB]
  );

  const toggleAlarm = useCallback(() => {
    setAlarmEnabled((prev) => {
      const next = !prev;
      saveToDB(bedtime, wakeTime, bufferMinutes, next);
      return next;
    });
  }, [bedtime, wakeTime, bufferMinutes, saveToDB]);

  const activate = useCallback(async () => {
    const now = new Date().toISOString();
    setActivatedAt(now);
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from("sleep_plans")
        .upsert(
          {
            device_id: deviceId.current,
            bedtime,
            wake_time: wakeTime,
            buffer_minutes: bufferMinutes,
            alarm_enabled: alarmEnabled,
            activated_at: now,
          } as any,
          { onConflict: "device_id" }
        );
      if (!error) setHasSleepPlanRow(true);
    } else {
      saveLocalPlan({
        bedtime,
        wake_time: wakeTime,
        buffer_minutes: bufferMinutes,
        alarm_enabled: alarmEnabled,
        activated_at: now,
      });
      setHasSleepPlanRow(true);
    }
  }, [bedtime, wakeTime, bufferMinutes, alarmEnabled]);

  const getCosyMugFill = useCallback((): number => {
    if (!activatedAt) return 0;
    const activationTime = new Date(activatedAt).getTime();
    const bedMins = timeToMinutes(bedtime);
    const now = new Date();
    const target = new Date(now);
    target.setHours(Math.floor(bedMins / 60), bedMins % 60, 0, 0);
    if (target.getTime() <= activationTime) {
      target.setDate(target.getDate() + 1);
    }
    const totalDuration = target.getTime() - activationTime;
    const elapsed = now.getTime() - activationTime;
    if (totalDuration <= 0) return 100;
    const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const rounded = Math.round(pct);
    if (rounded >= 100) {
      const overTime = now.getTime() - target.getTime();
      if (overTime > 10 * 60 * 1000) return -1;
      return 100;
    }
    return rounded;
  }, [activatedAt, bedtime]);

  const resetActivation = useCallback(async () => {
    setActivatedAt(null);
    if (isSupabaseConfigured) {
      await supabase
        .from("sleep_plans")
        .update({ activated_at: null } as any)
        .eq("device_id", deviceId.current);
    } else {
      const local = loadLocalPlan();
      if (local) saveLocalPlan({ ...local, activated_at: null });
    }
  }, []);

  // Recalculate buffer every minute
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      setBufferState(calcBuffer(bedtime));
    }, 60000);
    return () => clearInterval(interval);
  }, [loaded, bedtime]);

  return {
    bedtime,
    wakeTime,
    bufferMinutes,
    alarmEnabled,
    activatedAt,
    loaded,
    hasSleepPlanRow,
    setBedtime,
    setWakeTime,
    setBufferMinutes,
    toggleAlarm,
    activate,
    getCosyMugFill,
    resetActivation,
  };
}
