/**
 * Number formatting utilities for Korean currency and amounts
 */

/**
 * Format a number with comma separators (e.g., 1,234,567)
 * Also handles string input by cleaning non-numeric characters first
 * @param value - Number or string to format
 * @returns Formatted string with comma separators
 */
export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";

  // If it's a number, convert to string
  const stringValue = typeof value === "number" ? value.toString() : value;

  // Remove all non-digit characters
  const cleanedValue = stringValue.replace(/[^0-9]/g, "");

  if (!cleanedValue) return "";

  // Add comma separators
  return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Parse a formatted number string back to a plain number string (digits only)
 * @param value - Formatted number string with commas
 * @returns Digits only string
 */
export function parseFormattedNumber(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

/**
 * Format a number as Korean currency (원)
 * @param value - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";

  const numValue = typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, ""), 10) : value;

  if (isNaN(numValue)) return "";

  return `${numValue.toLocaleString("ko-KR")}원`;
}

/**
 * Format a number with unit suffix
 * @param value - Number to format
 * @param unit - Unit suffix (e.g., "개", "건", "원")
 * @returns Formatted string with unit
 */
export function formatWithUnit(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === "") return "";

  const numValue = typeof value === "string" ? parseInt(value.replace(/[^0-9]/g, ""), 10) : value;

  if (isNaN(numValue)) return "";

  return `${numValue.toLocaleString("ko-KR")}${unit}`;
}
