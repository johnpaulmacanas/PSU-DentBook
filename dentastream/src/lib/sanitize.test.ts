import { describe, it, expect } from 'vitest';
import { sanitize, sanitizeEmail } from './sanitize';

describe('sanitize', () => {
  it('trims surrounding whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  it('strips HTML tags (XSS vector)', () => {
    expect(sanitize('<script>alert(1)</script>hi')).toBe('alert(1)hi');
    expect(sanitize('<b>bold</b>')).toBe('bold');
  });

  it('strips SQL-adjacent characters', () => {
    expect(sanitize(`Robert'); DROP TABLE--`)).toBe('Robert) DROP TABLE--');
    expect(sanitize('a"b`c;d\\e')).toBe('abcde');
  });

  it('caps length at 2000 characters', () => {
    expect(sanitize('x'.repeat(5000))).toHaveLength(2000);
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitize('   ')).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('lowercases and trims', () => {
    expect(sanitizeEmail('  USER@Clinic.COM ')).toBe('user@clinic.com');
  });

  it('caps length at 320 characters', () => {
    const long = `${'a'.repeat(400)}@x.com`;
    expect(sanitizeEmail(long)).toHaveLength(320);
  });
});
