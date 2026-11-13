import type { Alarm } from './types';

type When = Pick<Alarm, 'hour' | 'minute' | 'repeatDays'>;

/** Next local time this alarm should ring. Strictly after `now`. */
export function nextOccurrence(alarm: When, now: Date): Date {
  const days = [...new Set(alarm.repeatDays.filter(day => day >= 0 && day <= 6))];

  if (days.length === 0) {
    const today = atTime(now, alarm.hour, alarm.minute);
    if (today.getTime() > now.getTime()) {
      return today;
    }
    return addDays(today, 1);
  }

  for (let offset = 0; offset < 8; offset++) {
    const candidate = atTime(addDays(now, offset), alarm.hour, alarm.minute);
    if (!days.includes(candidate.getDay())) {
      continue;
    }
    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  return addDays(atTime(now, alarm.hour, alarm.minute), 1);
}

function atTime(base: Date, hour: number, minute: number): Date {
  const next = new Date(base);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}
