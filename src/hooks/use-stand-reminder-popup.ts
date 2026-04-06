import { useCallback, useEffect, useRef, useState } from "react";
import { getLocalDateKey } from "@/lib/evening-reminder-storage";
import { standPopupStorageKey, timeToMinutes } from "@/lib/stand-reminder-time";

/**
 * Scheduled: once per day after stand time (bedtime − 30 min), if scheduleEnabled.
 * Preview: opens when immediateSignal bumps and loaded (no plan row required for preview).
 */
export function useStandReminderPopup(
  scheduleEnabled: boolean,
  standTimeHHmm: string,
  immediateSignal: number,
  loaded: boolean
) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [scheduledOpen, setScheduledOpen] = useState(false);
  const open = previewOpen || scheduledOpen;
  const sessionShownRef = useRef(false);
  const lastDateRef = useRef("");

  const dismiss = useCallback(() => {
    setPreviewOpen(false);
    setScheduledOpen(false);
  }, []);

  useEffect(() => {
    if (!loaded) {
      setPreviewOpen(false);
      return;
    }
    if (immediateSignal === 0) return;
    setPreviewOpen(true);
  }, [immediateSignal, loaded]);

  useEffect(() => {
    if (!scheduleEnabled) {
      setScheduledOpen(false);
      return;
    }

    const tick = () => {
      const now = new Date();
      const todayKey = getLocalDateKey(now);

      if (lastDateRef.current !== todayKey) {
        sessionShownRef.current = false;
        lastDateRef.current = todayKey;
      }

      const storageKey = standPopupStorageKey(todayKey);
      if (localStorage.getItem(storageKey)) return;

      const standM = timeToMinutes(standTimeHHmm);
      const nowM = now.getHours() * 60 + now.getMinutes();

      if (nowM < standM) return;
      if (sessionShownRef.current) return;

      sessionShownRef.current = true;
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setScheduledOpen(true);

      if ("Notification" in window && Notification.permission === "granted") {
        const img = new URL("/stand-reminder-lulu.png", window.location.origin).href;
        new Notification("Lulu", {
          body: "Lulu's a bit tired — could you put me on the stand?",
          icon: img,
        });
      }
    };

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [scheduleEnabled, standTimeHHmm]);

  return {
    open,
    dismiss,
    setOpen: (v: boolean) => {
      if (!v) dismiss();
      else setPreviewOpen(true);
    },
  };
}
