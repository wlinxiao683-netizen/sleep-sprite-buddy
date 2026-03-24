/** Local calendar date yyyy-mm-dd in the user's timezone */
export function getLocalDateKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const EVENING_REMINDER_TIME_KEY = "sleepwell_evening_reminder_time";
export const EVENING_REMINDER_ENABLED_KEY = "sleepwell_evening_reminder_enabled";

/** Once shown or dismissed for a calendar day, we skip until the next day */
export function eveningPopupStorageKey(dateKey: string): string {
  return `sleepwell_evening_popup_${dateKey}`;
}

export function parseHHmm(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: Number.isFinite(h) ? h : 20, minute: Number.isFinite(m) ? m : 0 };
}

/** After the user changes reminder settings, allow the popup to show again today at the new time. */
export function clearTodayEveningPopupShownFlag(): void {
  try {
    localStorage.removeItem(eveningPopupStorageKey(getLocalDateKey()));
  } catch {
    /* ignore */
  }
}
