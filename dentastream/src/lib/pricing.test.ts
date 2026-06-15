import { describe, it, expect } from 'vitest';
import { estimateFee, DEFAULT_FEE } from './pricing';
import { CONCERN_OPTIONS } from './format';
import type { Concern } from '../types';

describe('DEFAULT_FEE', () => {
  it('is a positive number', () => {
    expect(DEFAULT_FEE).toBeGreaterThan(0);
  });
});

describe('estimateFee', () => {
  it('returns DEFAULT_FEE for null', () => {
    expect(estimateFee(null)).toBe(DEFAULT_FEE);
  });

  it('returns DEFAULT_FEE for undefined', () => {
    expect(estimateFee(undefined)).toBe(DEFAULT_FEE);
  });

  it('returns DEFAULT_FEE for an empty string', () => {
    expect(estimateFee('')).toBe(DEFAULT_FEE);
  });

  it('returns the correct fee for every concern type', () => {
    // Verify all 10 defined concerns return a positive fee.
    const allConcerns: Concern[] = [
      'checkup', 'tooth_pain', 'broken_tooth', 'gum_problem', 'whitening',
      'braces', 'tooth_removal', 'child_visit', 'follow_up', 'not_sure',
    ];
    for (const concern of allConcerns) {
      const fee = estimateFee(concern);
      expect(fee, `Fee for "${concern}" should be a positive number`).toBeGreaterThan(0);
    }
  });

  it('covers every concern listed in CONCERN_OPTIONS (no orphaned entries)', () => {
    for (const { value } of CONCERN_OPTIONS) {
      const fee = estimateFee(value as Concern);
      expect(fee, `Missing fee entry for concern "${value}"`).toBeGreaterThan(0);
    }
  });

  it('returns distinct fees for premium and basic services', () => {
    // Braces (most expensive) should cost more than a follow-up (cheapest).
    expect(estimateFee('braces')).toBeGreaterThan(estimateFee('follow_up'));
    // Whitening should cost more than a standard check-up.
    expect(estimateFee('whitening')).toBeGreaterThan(estimateFee('checkup'));
    // Tooth removal should cost more than a child visit.
    expect(estimateFee('tooth_removal')).toBeGreaterThan(estimateFee('child_visit'));
  });

  it('returns a number (not NaN) for all concerns', () => {
    const allConcerns: Concern[] = [
      'checkup', 'tooth_pain', 'broken_tooth', 'gum_problem', 'whitening',
      'braces', 'tooth_removal', 'child_visit', 'follow_up', 'not_sure',
    ];
    for (const concern of allConcerns) {
      expect(Number.isNaN(estimateFee(concern))).toBe(false);
    }
  });
});
