const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export type ReviewOutcome = "AGAIN" | "HARD" | "GOOD" | "EASY";

export type SrsState = {
  ease: number;
  interval: number;
  repetitions: number;
};

export type SrsResult = SrsState & { dueAt: Date };

export function scheduleNext(
  state: SrsState,
  rating: ReviewOutcome,
  now: Date = new Date(),
): SrsResult {
  let { ease, interval, repetitions } = state;

  if (rating === "AGAIN") {
    return {
      ease: Math.max(1.3, ease - 0.2),
      interval: 0,
      repetitions: 0,
      dueAt: new Date(now.getTime() + 10 * MINUTE_MS),
    };
  }

  if (rating === "HARD") ease = Math.max(1.3, ease - 0.15);
  if (rating === "EASY") ease = Math.min(2.8, ease + 0.15);

  if (repetitions === 0) interval = 1;
  else if (repetitions === 1) interval = 6;
  else interval = Math.max(1, Math.round(interval * ease));

  if (rating === "HARD") interval = Math.max(1, Math.round(interval * 0.8));
  if (rating === "EASY") interval = Math.round(interval * 1.3);

  return {
    ease,
    interval,
    repetitions: repetitions + 1,
    dueAt: new Date(now.getTime() + interval * DAY_MS),
  };
}