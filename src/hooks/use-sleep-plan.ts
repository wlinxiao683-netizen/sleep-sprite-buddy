import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

function getDeviceId(): string {
  let id = localStorage.getItem("sleepwell_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("sleepwell_device_id", id);
  }
  return id;
}

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

/** Calculate buffer = bedtime - now (in minutes), clamped 0-360 */
function calcBuffer(bedtime: string): number {
  const nowMins = getCurrentMinutes();
  const bedMins = timeToMinutes(bedtime);
  let diff = bedMins - nowMins;
  if (diff < 0) diff += 1440;
  // If diff is huge (>12h), treat as 0
  if (diff > 720) return 0;
  return Math.min(diff, 360);
}

/** Calculate bedtime = now + buffer */
function calcBedtime(bufferMinutes: number): string {
  const nowMins = getCurrentMinutes();
  return minutesToTime(nowMins + bufferMinutes);
}

export function useSleepPlan() {
  const [bedtime, setBedtimeState] = useState("23:00");
  const [wakeTime, setWakeTimeState] = useState("07:00");
  const [bufferMinutes, setBufferState] = useState(15);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  /** True once a row exists in sleep_plans for this device (load or after save). */
  const [hasSleepPlanRow, setHasSleepPlanRow] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const deviceId = useRef(getDeviceId());

  // Load from DB
  useEffect(() => {
    (async () => {
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
        // Init with current time logic
        const buf = calcBuffer("23:00");
        setBufferState(buf);
      }
      setLoaded(true);
    })();
  }, []);

  // Debounced save to DB
  const saveToDB = useCallback(
    (bed: string, wake: string, buffer: number, alarm: boolean) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
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
      }, 500);
    },
    []
  );

  // When bedtime changes (from circular picker) → recalc buffer
  const setBedtime = useCallback(
    (newBedtime: string) => {
      setBedtimeState(newBedtime);
      const newBuffer = calcBuffer(newBedtime);
      setBufferState(newBuffer);
      saveToDB(newBedtime, wakeTime, newBuffer, alarmEnabled);
    },
    [wakeTime, alarmEnabled, saveToDB]
  );

  // When wake time changes → just save
  const setWakeTime = useCallback(
    (newWake: string) => {
      setWakeTimeState(newWake);
      saveToDB(bedtime, newWake, bufferMinutes, alarmEnabled);
    },
    [bedtime, bufferMinutes, alarmEnabled, saveToDB]
  );

  // When buffer changes (from slider) → recalc bedtime
  const setBufferMinutes = useCallback(
    (newBuffer: number) => {
      setBufferState(newBuffer);
      const newBedtime = calcBedtime(newBuffer);
      setBedtimeState(newBedtime);
      saveToDB(newBedtime, wakeTime, newBuffer, alarmEnabled);
    },
    [wakeTime, alarmEnabled, saveToDB]
  );

  // Toggle alarm
  const toggleAlarm = useCallback(() => {
    setAlarmEnabled((prev) => {
      const next = !prev;
      saveToDB(bedtime, wakeTime, bufferMinutes, next);
      return next;
    });
  }, [bedtime, wakeTime, bufferMinutes, saveToDB]);

  // Activate the plan (commit & activate)
  const activate = useCallback(async () => {
    const now = new Date().toISOString();
    setActivatedAt(now);
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
  }, [bedtime, wakeTime, bufferMinutes, alarmEnabled]);

  /** Get the cozy mug fill percentage (0-100) based on elapsed time since activation.
   *  Stays at 100% for 10 minutes after bedtime, then auto-resets to 0. */
  const getCosyMugFill = useCallback((): number => {
    if (!activatedAt) return 0;
    const activationTime = new Date(activatedAt).getTime();
    const bedMins = timeToMinutes(bedtime);
    // Build target date: today at bedtime
    const now = new Date();
    const target = new Date(now);
    target.setHours(Math.floor(bedMins / 60), bedMins % 60, 0, 0);
    // If bedtime is before activation, it means next day
    if (target.getTime() <= activationTime) {
      target.setDate(target.getDate() + 1);
    }
    const totalDuration = target.getTime() - activationTime;
    const elapsed = now.getTime() - activationTime;
    if (totalDuration <= 0) return 100;
    const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const rounded = Math.round(pct);

    if (rounded >= 100) {
      // Check if more than 10 minutes past bedtime
      const overTime = now.getTime() - target.getTime();
      if (overTime > 10 * 60 * 1000) {
        // Auto-reset: clear activation
        return -1; // signal reset
      }
      return 100;
    }
    return rounded;
  }, [activatedAt, bedtime]);

  /** Reset activation state (clears activatedAt in state and DB) */
  const resetActivation = useCallback(async () => {
    setActivatedAt(null);
    await supabase
      .from("sleep_plans")
      .update({ activated_at: null } as any)
      .eq("device_id", deviceId.current);
  }, []);

  // Update buffer every minute based on current time
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      const newBuffer = calcBuffer(bedtime);
      setBufferState(newBuffer);
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
