/**
 * Pure, dependency-free validators. No DB, no React — fully unit-testable.
 * Components use these to gate form submission and render field errors.
 */
import type { Concern } from '../types';

/** RFC-lite email check: a single @, non-empty local + domain with a dot. */
export function isEmail(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Phone check for PH-style numbers. Accepts digits, spaces, dashes, parens,
 * and an optional leading +. Requires 7–15 digits once stripped.
 */
export function isPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 7 && digits.length <= 15 && /^[\d\s()+-]+$/.test(value.trim());
}

/** Non-empty after trimming. */
export function isRequired(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export interface IntakeForm {
  full_name: string;
  email: string;
  contact: string;
  concern: Concern | '';
  consent: boolean;
  // Optional fields are not validated for presence:
  address?: string;
  birthdate?: string;
  age?: string;
  sex?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_number?: string;
}

export type IntakeErrors = Partial<Record<keyof IntakeForm, string>>;

/**
 * Validates the patient intake form. Returns a map of field -> message;
 * an empty object means the form is valid.
 */
export function validateIntake(form: IntakeForm): IntakeErrors {
  const errors: IntakeErrors = {};

  if (!isRequired(form.full_name)) {
    errors.full_name = 'Full name is required.';
  }

  if (!isRequired(form.email)) {
    errors.email = 'Email is required.';
  } else if (!isEmail(form.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!isRequired(form.contact)) {
    errors.contact = 'Phone number is required.';
  } else if (!isPhone(form.contact)) {
    errors.contact = 'Enter a valid phone number.';
  }

  if (!isRequired(form.concern)) {
    errors.concern = 'Please select a concern.';
  }

  // Emergency contact number, if provided, must look like a phone.
  if (isRequired(form.emergency_contact_number) && !isPhone(form.emergency_contact_number!)) {
    errors.emergency_contact_number = 'Enter a valid contact number.';
  }

  if (!form.consent) {
    errors.consent = 'You must accept the data privacy consent to continue.';
  }

  return errors;
}

/** True when an intake form has no validation errors. */
export function isIntakeValid(form: IntakeForm): boolean {
  return Object.keys(validateIntake(form)).length === 0;
}
