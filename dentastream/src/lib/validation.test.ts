import { describe, it, expect } from 'vitest';
import {
  isEmail, isPhone, isRequired, validateIntake, isIntakeValid,
  type IntakeForm,
} from './validation';

describe('isEmail', () => {
  it('accepts valid addresses', () => {
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('  user@clinic.co.uk  ')).toBe(true);
  });
  it('rejects invalid addresses', () => {
    expect(isEmail('no-at')).toBe(false);
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.com')).toBe(false);
    expect(isEmail('')).toBe(false);
  });
});

describe('isPhone', () => {
  it('accepts common phone formats', () => {
    expect(isPhone('09171234567')).toBe(true);
    expect(isPhone('+63 917 123 4567')).toBe(true);
    expect(isPhone('(02) 8123-4567')).toBe(true);
  });
  it('rejects too short or non-numeric', () => {
    expect(isPhone('123')).toBe(false);
    expect(isPhone('abcdefg')).toBe(false);
    expect(isPhone('')).toBe(false);
  });
});

describe('isRequired', () => {
  it('is true only for non-empty trimmed strings', () => {
    expect(isRequired('x')).toBe(true);
    expect(isRequired('  ')).toBe(false);
    expect(isRequired('')).toBe(false);
    expect(isRequired(null)).toBe(false);
    expect(isRequired(undefined)).toBe(false);
  });
});

function validForm(overrides: Partial<IntakeForm> = {}): IntakeForm {
  return {
    full_name: 'Maria Santos',
    email: 'maria@clinic.com',
    contact: '09171234567',
    concern: 'checkup',
    consent: true,
    ...overrides,
  };
}

describe('validateIntake', () => {
  it('returns no errors for a valid form', () => {
    expect(validateIntake(validForm())).toEqual({});
    expect(isIntakeValid(validForm())).toBe(true);
  });

  it('flags missing required fields', () => {
    const errors = validateIntake(validForm({ full_name: '', email: '', contact: '', concern: '' }));
    expect(errors.full_name).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.contact).toBeDefined();
    expect(errors.concern).toBeDefined();
  });

  it('flags an invalid email', () => {
    expect(validateIntake(validForm({ email: 'bad' })).email).toBeDefined();
  });

  it('flags an invalid phone', () => {
    expect(validateIntake(validForm({ contact: '123' })).contact).toBeDefined();
  });

  it('requires consent', () => {
    expect(validateIntake(validForm({ consent: false })).consent).toBeDefined();
    expect(isIntakeValid(validForm({ consent: false }))).toBe(false);
  });

  it('validates emergency number only when provided', () => {
    expect(validateIntake(validForm({ emergency_contact_number: '' })).emergency_contact_number).toBeUndefined();
    expect(validateIntake(validForm({ emergency_contact_number: '123' })).emergency_contact_number).toBeDefined();
    expect(validateIntake(validForm({ emergency_contact_number: '09171234567' })).emergency_contact_number).toBeUndefined();
  });
});
