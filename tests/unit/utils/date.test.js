import { describe, it, expect } from 'vitest';
import { today, format, parse, daysInMonth, firstDayOfMonth, monthName, dayNames, formatTime, formatDuration } from '../../../src/utils/date.js';

describe('date utils', () => {
  describe('format', () => {
    it('formats date as YYYY-MM-DD', () => {
      expect(format(new Date(2026, 0, 15))).toBe('2026-01-15');
      expect(format(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('pads single-digit month and day', () => {
      expect(format(new Date(2026, 2, 5))).toBe('2026-03-05');
    });
  });

  describe('today', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = today();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('parse', () => {
    it('parses YYYY-MM-DD string to Date', () => {
      const d = parse('2026-06-15');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(5); // 0-indexed
      expect(d.getDate()).toBe(15);
    });
  });

  describe('daysInMonth', () => {
    it('returns correct days for each month', () => {
      expect(daysInMonth(2026, 0)).toBe(31);  // Jan
      expect(daysInMonth(2026, 1)).toBe(28);  // Feb (non-leap)
      expect(daysInMonth(2024, 1)).toBe(29);  // Feb (leap)
      expect(daysInMonth(2026, 3)).toBe(30);  // Apr
    });
  });

  describe('firstDayOfMonth', () => {
    it('returns 0-6 day of week for first day', () => {
      const day = firstDayOfMonth(2026, 5); // June 2026
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    });
  });

  describe('monthName', () => {
    it('returns correct month names', () => {
      expect(monthName(0)).toBe('January');
      expect(monthName(11)).toBe('December');
    });
  });

  describe('dayNames', () => {
    it('returns 7 day abbreviations', () => {
      const names = dayNames();
      expect(names).toHaveLength(7);
      expect(names[0]).toBe('Sun');
      expect(names[6]).toBe('Sat');
    });
  });

  describe('formatTime', () => {
    it('formats ISO date string to time', () => {
      const result = formatTime('2026-06-15T14:30:00');
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatDuration', () => {
    it('formats seconds to M:SS', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(600)).toBe('10:00');
    });
  });
});
