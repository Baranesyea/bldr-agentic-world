/**
 * Format phone number to E.164 format (+972XXXXXXXXX)
 * Handles Israeli numbers: 05X, 972, +972, etc.
 */
export function formatPhoneE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned) return null;

  // Remove leading +
  const hasPlus = cleaned.startsWith("+");
  if (hasPlus) cleaned = cleaned.slice(1);

  // If starts with 972, normalize
  if (cleaned.startsWith("972")) {
    cleaned = cleaned.slice(3);
  }

  // If starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // Israeli mobile numbers should be 9 digits (5XXXXXXXX)
  if (cleaned.length === 9 && cleaned.startsWith("5")) {
    return `+972${cleaned}`;
  }

  // Israeli landline (2/3/4/8/9 prefix, 8 digits)
  if (cleaned.length === 8 && /^[23489]/.test(cleaned)) {
    return `+972${cleaned}`;
  }

  // If it's already a full international number (10+ digits)
  if (cleaned.length >= 10) {
    return `+${cleaned}`;
  }

  // Fallback — return with +972 prefix if looks Israeli
  if (cleaned.length >= 7 && cleaned.length <= 10) {
    return `+972${cleaned}`;
  }

  return phone; // Can't format, return as-is
}
