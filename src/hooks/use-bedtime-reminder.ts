import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Hook that triggers reminders:
 * 1. When buffer zone reaches 5 minutes before bedtime (after activation)
 * 2. Daily at 8PM to remind user to set their sleep plan
 */
export function useBedtimeReminder(
  bufferMinutes: number,
  activatedAt: string | null,
  loaded: boolean
) {
  const [showBufferAlert, setShowBufferAlert] = useState(false);
  const [showEveningReminder, setShowEveningReminder] = useState(false);
  const bufferAlertShown = useRef(false);
  const eveningReminderShown = useRef(false);

  // Reset buffer alert flag when activation changes
  useEffect(() => {
    if (!activatedAt) {
      bufferAlertShown.current = false;
    }
  }, [activatedAt]);

  // Check buffer zone — show alert at 5 minutes
  useEffect(() => {
    if (!loaded || !activatedAt) return;
    if (bufferAlertShown.current) return;

    if (bufferMinutes <= 5 && bufferMinutes > 0) {
      bufferAlertShown.current = true;
      setShowBufferAlert(true);

      // Also try browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🌙 Bedtime in 5 minutes!", {
          body: "Time to start winding down. Your sprite is waiting!",
          icon: "/favicon.ico",
        });
      }
    }
  }, [bufferMinutes, activatedAt, loaded]);

  // Check for 8PM evening reminder
  useEffect(() => {
    if (!loaded) return;

    const checkEvening = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = `evening_reminder_${now.toISOString().split("T")[0]}`;

      // At 8PM (20:00), if not already activated and not already reminded today
      if (hour === 20 && minute < 5 && !activatedAt && !localStorage.getItem(todayKey)) {
        if (!eveningReminderShown.current) {
          eveningReminderShown.current = true;
          localStorage.setItem(todayKey, "1");
          setShowEveningReminder(true);

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🛏️ Time to plan your sleep!", {
              body: "Set your bedtime and screen time for tonight.",
              icon: "/favicon.ico",
            });
          }
        }
      }
    };

    checkEvening();
    const interval = setInterval(checkEvening, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [loaded, activatedAt]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const dismissBufferAlert = useCallback(() => setShowBufferAlert(false), []);
  const dismissEveningReminder = useCallback(() => {
    setShowEveningReminder(false);
    eveningReminderShown.current = true;
  }, []);

  return {
    showBufferAlert,
    showEveningReminder,
    dismissBufferAlert,
    dismissEveningReminder,
  };
}
