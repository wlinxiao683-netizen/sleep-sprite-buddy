const POINTS_KEY = "sleepwell_happiness_points";
const OWNED_DECOR_KEY = "sleepwell_happiness_owned_decor";

export const HAPPINESS_POINTS_PER_REWARD = 3;

export type DecorationId = "dream_wings" | "moon_halo";

export const REDEEMABLE_DECORATIONS: {
  id: DecorationId;
  name: string;
  icon: string;
}[] = [
  { id: "dream_wings", name: "Dream Wings", icon: "🦋" },
  { id: "moon_halo", name: "Moon Halo", icon: "🌙" },
];

/**
 * True if collection is on or before scheduled bedtime + 10 minutes,
 * for the same "night" window (today or yesterday at bedtime clock).
 */
export function qualifiesForHappinessPoint(bedtime: string, collectedAt: Date): boolean {
  const [bh, bm] = bedtime.split(":").map(Number);
  if (!Number.isFinite(bh) || !Number.isFinite(bm)) return false;

  for (const dayOffset of [0, -1] as const) {
    const bed = new Date(collectedAt);
    bed.setDate(bed.getDate() + dayOffset);
    bed.setHours(bh, bm, 0, 0);

    const deadline = bed.getTime() + 10 * 60 * 1000;
    if (collectedAt.getTime() > deadline) continue;

    const earliest = bed.getTime() - 16 * 60 * 60 * 1000;
    if (collectedAt.getTime() < earliest) continue;

    return true;
  }
  return false;
}

export function getHappinessPoints(): number {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, HAPPINESS_POINTS_PER_REWARD);
  } catch {
    return 0;
  }
}

export function setHappinessPoints(n: number): void {
  const v = Math.max(0, Math.min(HAPPINESS_POINTS_PER_REWARD, Math.floor(n)));
  try {
    localStorage.setItem(POINTS_KEY, String(v));
  } catch {
    /* ignore */
  }
}

export function addHappinessPoint(): number {
  const next = Math.min(HAPPINESS_POINTS_PER_REWARD, getHappinessPoints() + 1);
  setHappinessPoints(next);
  return next;
}

/** Spend 3 points and unlock one decoration. Returns false if not enough points or already owned. */
export function redeemDecorationForPoints(id: DecorationId): boolean {
  if (getHappinessPoints() < HAPPINESS_POINTS_PER_REWARD) return false;
  if (getOwnedRedeemableDecorIds().has(id)) return false;
  setHappinessPoints(0);
  unlockDecoration(id);
  return true;
}

export function clearHappinessPoints(): void {
  setHappinessPoints(0);
}

export function getOwnedRedeemableDecorIds(): Set<DecorationId> {
  try {
    const raw = localStorage.getItem(OWNED_DECOR_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is DecorationId => x === "dream_wings" || x === "moon_halo"));
  } catch {
    return new Set();
  }
}

export function unlockDecoration(id: DecorationId): void {
  const owned = getOwnedRedeemableDecorIds();
  owned.add(id);
  try {
    localStorage.setItem(OWNED_DECOR_KEY, JSON.stringify([...owned]));
  } catch {
    /* ignore */
  }
}
