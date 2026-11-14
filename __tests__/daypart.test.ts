import { daypartFor } from '../src/features/alarm/DaypartHeader';

describe('daypart header', () => {
  it('covers the four local-time states', () => {
    expect(daypartFor(new Date(2026, 10, 14, 5, 0))).toBe('morning');
    expect(daypartFor(new Date(2026, 10, 14, 10, 59))).toBe('morning');
    expect(daypartFor(new Date(2026, 10, 14, 11, 0))).toBe('afternoon');
    expect(daypartFor(new Date(2026, 10, 14, 16, 59))).toBe('afternoon');
    expect(daypartFor(new Date(2026, 10, 14, 17, 0))).toBe('evening');
    expect(daypartFor(new Date(2026, 10, 14, 19, 59))).toBe('evening');
    expect(daypartFor(new Date(2026, 10, 14, 20, 0))).toBe('night');
    expect(daypartFor(new Date(2026, 10, 14, 4, 59))).toBe('night');
  });
});
