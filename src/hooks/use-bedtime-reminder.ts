import { useEffect, useRef, useCallback, useState } from "react";

/**
 * When buffer zone reaches 5 minutes before bedtime (after activation),
 * show an alert and optionally a browser notification.
 */
export function useBedtimeReminder(
  bufferMinutes: number,
  activatedAt: string | null,
  loaded: boolean
) {
  const [showBufferAlert, setShowBufferAlert] = useState(false);
  const bufferAlertShown = useRef(false);

  useEffect(() => {
    if (!activatedAt) {
      bufferAlertShown.current = false;
    }
  }, [activatedAt]);

  useEffect(() => {
    if (!loaded || !activatedAt) return;
    if (bufferAlertShown.current) return;

    if (bufferMinutes <= 5 && bufferMinutes > 0) {
      bufferAlertShown.current = true;
      setShowBufferAlert(true);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🌙 Bedtime in 5 minutes!", {
          body: "Time to start winding down. Your sprite is waiting!",
          icon: "/favicon.ico",
        });
      }
    }
  }, [bufferMinutes, activatedAt, loaded]);

  const dismissBufferAlert = useCallback(() => setShowBufferAlert(false), []);

  return {
    showBufferAlert,
    dismissBufferAlert,
  };
}
