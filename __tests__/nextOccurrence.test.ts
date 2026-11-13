import { nextOccurrence } from '../src/features/alarm/nextOccurrence';

const at = (y: number, m: number, d: number, h: number, min: number, s = 0) =>
  new Date(y, m - 1, d, h, min, s);

describe('nextOccurrence', () => {
  const fridayEvening = at(2026, 11, 13, 18, 23);

  it('uses later today for a one-time alarm', () => {
    const next = nextOccurrence(
      { hour: 19, minute: 0, repeatDays: [] },
      fridayEvening,
    );
    expect(next).toEqual(at(2026, 11, 13, 19, 0));
  });

  it('moves a one-time alarm that already passed to tomorrow', () => {
    const next = nextOccurrence(
      { hour: 7, minute: 0, repeatDays: [] },
      fridayEvening,
    );
    expect(next).toEqual(at(2026, 11, 14, 7, 0));
  });

  it('does not schedule the exact current minute', () => {
    const next = nextOccurrence(
      { hour: 7, minute: 0, repeatDays: [] },
      at(2026, 11, 13, 7, 0),
    );
    expect(next).toEqual(at(2026, 11, 14, 7, 0));
  });

  it('picks the next weekday when today is past', () => {
    const next = nextOccurrence(
      { hour: 7, minute: 0, repeatDays: [1, 2, 3, 4, 5] },
      fridayEvening,
    );
    expect(next).toEqual(at(2026, 11, 16, 7, 0));
    expect(next.getDay()).toBe(1);
  });

  it('keeps today when the weekday time is still ahead', () => {
    const next = nextOccurrence(
      { hour: 7, minute: 0, repeatDays: [1, 2, 3, 4, 5] },
      at(2026, 11, 13, 6, 0),
    );
    expect(next).toEqual(at(2026, 11, 13, 7, 0));
  });

  it('rolls an every-day alarm to tomorrow after the time', () => {
    const next = nextOccurrence(
      { hour: 7, minute: 30, repeatDays: [0, 1, 2, 3, 4, 5, 6] },
      fridayEvening,
    );
    expect(next).toEqual(at(2026, 11, 14, 7, 30));
  });

  it('jumps from Friday to Saturday for weekends', () => {
    const next = nextOccurrence(
      { hour: 9, minute: 15, repeatDays: [0, 6] },
      fridayEvening,
    );
    expect(next).toEqual(at(2026, 11, 14, 9, 15));
    expect(next.getDay()).toBe(6);
  });

  it('waits a full week when the only day has passed', () => {
    const next = nextOccurrence(
      { hour: 8, minute: 0, repeatDays: [0] },
      at(2026, 11, 15, 9, 0),
    );
    expect(next).toEqual(at(2026, 11, 22, 8, 0));
    expect(next.getDay()).toBe(0);
  });
});
