import { getLocalDateKey } from "@/lib/evening-reminder-storage";

export const STAND_REMINDER_MINUTES_BEFORE_BED = 30;

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Clock time that is N minutes before `bedtime` (same day, wraps past midnight). */
export function standReminderTimeFromBedtime(bedtime: string): string {
  const bed = timeToMinutes(bedtime);
  let stand = bed - STAND_REMINDER_MINUTES_BEFORE_BED;
  if (stand < 0) stand += 1440;
  return minutesToTime(stand);
}

export function standPopupStorageKey(dateKey: string): string {
  return `sleepwell_stand_popup_${dateKey}`;
}

export function clearTodayStandPopupShownFlag(): void {
  try {
    localStorage.removeItem(standPopupStorageKey(getLocalDateKey()));
  } catch {
    /* ignore */
  }
}
