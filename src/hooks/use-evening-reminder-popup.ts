import { useCallback, useEffect, useRef, useState } from "react";
import {
  eveningPopupStorageKey,
  getLocalDateKey,
  parseHHmm,
} from "@/lib/evening-reminder-storage";

/**
 * Scheduled: once per day after reminder time (marks localStorage).
 * Preview: opens immediately when `immediateSignal` bumps (e.g. user changed time in Profile).
 */
export function useEveningReminderPopup(
  enabled: boolean,
  timeHHmm: string,
  immediateSignal: number
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
    if (!enabled) {
      setPreviewOpen(false);
      setScheduledOpen(false);
      return;
    }
    if (immediateSignal === 0) return;
    sessionShownRef.current = false;
    setPreviewOpen(true);
  }, [immediateSignal, enabled]);

  useEffect(() => {
    if (!enabled) {
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

      const storageKey = eveningPopupStorageKey(todayKey);
      if (localStorage.getItem(storageKey)) return;

      const { hour, minute } = parseHHmm(timeHHmm);
      const nowM = now.getHours() * 60 + now.getMinutes();
      const remM = hour * 60 + minute;

      if (nowM < remM) return;
      if (sessionShownRef.current) return;

      sessionShownRef.current = true;
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
      setScheduledOpen(true);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Daily sleep reminder", {
          body: "Open the Plan tab to set tonight's bedtime and wake time.",
          icon: "/favicon.ico",
        });
      }
    };

    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [enabled, timeHHmm]);

  return { open, dismiss, setOpen: (v: boolean) => {
    if (!v) dismiss();
    else setPreviewOpen(true);
  } };
}
