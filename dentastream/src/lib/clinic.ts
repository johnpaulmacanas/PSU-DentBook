/**
 * Clinic identity shown on appointment details, receipts, and certificates.
 * Centralized so every surface uses the same values (mirrors the admin
 * Settings fields). Swap for a settings table read if that's added later.
 */
export const CLINIC = {
  name: 'DentaStream Dental Clinic',
  address: '2nd Floor, Medical Arts Bldg, Rizal Ave, Manila',
  phone: '(02) 8123-4567',
  hours: 'Mon–Sat, 8:00 AM – 6:00 PM',
} as const;

export const FB_PAGE_URL  = 'https://www.facebook.com/profile.php?id=61591029084416';
export const MESSENGER_URL = 'https://m.me/61591029084416';
