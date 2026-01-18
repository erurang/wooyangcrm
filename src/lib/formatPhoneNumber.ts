/**
 * Korean phone number formatting utility
 * Formats phone numbers in standard Korean formats:
 * - Mobile: 010-1234-5678
 * - Seoul landline: 02-1234-5678
 * - Other regions: 031-123-4567
 * - Toll-free: 080-123-4567
 */

/**
 * Format a phone number string to Korean standard format
 * @param value - Raw phone number string (digits only or partially formatted)
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "");

  if (!digits) return "";

  // Mobile phone (010, 011, 016, 017, 018, 019)
  if (digits.startsWith("01")) {
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    }
  }

  // Seoul (02)
  if (digits.startsWith("02")) {
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
  }

  // Toll-free (080, 070) and other special numbers
  if (digits.startsWith("080") || digits.startsWith("070")) {
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  }

  // Other regional numbers (031, 032, 033, etc.)
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
}

/**
 * Remove formatting from phone number (returns digits only)
 * @param value - Formatted phone number
 * @returns Digits only string
 */
export function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Check if a phone number is valid Korean format
 * @param value - Phone number string
 * @returns Whether the phone number is valid
 */
export function isValidKoreanPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  // Check minimum/maximum length
  if (digits.length < 9 || digits.length > 11) {
    return false;
  }

  // Check valid prefixes
  const validPrefixes = [
    "02",    // Seoul
    "031", "032", "033", "041", "042", "043", "044",  // Regions
    "051", "052", "053", "054", "055", "061", "062", "063", "064",  // More regions
    "010", "011", "016", "017", "018", "019",  // Mobile
    "070", "080",  // VoIP and toll-free
  ];

  return validPrefixes.some(prefix => digits.startsWith(prefix));
}
