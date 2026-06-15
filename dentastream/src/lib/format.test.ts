import { describe, it, expect } from 'vitest';
import {
  formatDate, formatTime, formatDateTime, formatMoney,
  appointmentStatusLabel, requestStatusLabel, invoiceStatusLabel,
  concernLabel, CONCERN_OPTIONS, appointmentStatusClasses,
} from './format';

describe('formatDate', () => {
  it('returns a dash for null/invalid', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
  it('formats a valid ISO date', () => {
    // Compare to the platform locale output to avoid TZ flakiness.
    const iso = '2026-03-12T09:00:00Z';
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
  });
});

describe('formatTime', () => {
  it('returns a dash for null/invalid', () => {
    expect(formatTime(null)).toBe('—');
    expect(formatTime('nope')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('joins date and time with a separator', () => {
    expect(formatDateTime('2026-03-12T09:00:00Z')).toContain('·');
  });
  it('returns a dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('formatMoney', () => {
  it('formats with peso sign and two decimals', () => {
    expect(formatMoney(1200)).toBe('₱1,200.00');
    expect(formatMoney(0)).toBe('₱0.00');
  });
  it('treats null/NaN as zero', () => {
    expect(formatMoney(null)).toBe('₱0.00');
    expect(formatMoney(Number.NaN)).toBe('₱0.00');
  });
});

describe('label helpers', () => {
  it('labels appointment statuses', () => {
    expect(appointmentStatusLabel('rescheduled')).toBe('Rescheduled');
    expect(appointmentStatusLabel('missed')).toBe('Missed');
  });
  it('labels request statuses', () => {
    expect(requestStatusLabel('approved')).toBe('Approved');
  });
  it('labels invoice statuses', () => {
    expect(invoiceStatusLabel('unpaid')).toBe('Unpaid');
  });
  it('labels concerns in plain language', () => {
    expect(concernLabel('tooth_pain')).toBe('Tooth pain');
    expect(concernLabel('not_sure')).toContain('Not sure');
  });
});

describe('CONCERN_OPTIONS', () => {
  it('covers all ten concerns', () => {
    expect(CONCERN_OPTIONS).toHaveLength(10);
    expect(CONCERN_OPTIONS.every(o => o.value && o.label)).toBe(true);
  });
});

describe('appointmentStatusClasses', () => {
  it('returns distinct classes for terminal states', () => {
    expect(appointmentStatusClasses('completed')).toContain('green');
    expect(appointmentStatusClasses('cancelled')).toContain('red');
  });
});
