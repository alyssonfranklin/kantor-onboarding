import crypto from 'crypto';

// Counter for generating sequential IDs for each prefix
const counters: Record<string, number> = {};

/**
 * Generates an ID with the specified prefix followed by a sequential number
 * Format: PREFIX_0001, PREFIX_0002, etc.
 */
export async function generateId(prefix: string): Promise<string> {
  // Initialize counter for this prefix if it doesn't exist
  if (!counters[prefix]) {
    counters[prefix] = 1;
  } else {
    counters[prefix]++;
  }
  
  // Format the counter with leading zeros
  const counter = counters[prefix].toString().padStart(4, '0');
  
  // Return the formatted ID
  return `${prefix}_${counter}`;
}

/**
 * Generates a custom ID in the format:
 * abc123de-4567-89fg-hij0-klmno123456
 * @deprecated Use generateId instead
 */
export function generateCustomId(): string {
  // Generate a standard UUID
  const uuid = crypto.randomUUID();
  
  // Split into parts
  const parts = uuid.split('-');
  
  // Ensure parts[0] has 8 characters with letters and numbers
  let part0 = parts[0];
  part0 = part0.replace(/[0-9]/g, c => String.fromCharCode(97 + parseInt(c))); // Convert some numbers to letters
  part0 = part0.replace(/[a-f]/g, c => String.fromCharCode(c.charCodeAt(0) - 32)); // Make some letters uppercase
  
  // Ensure parts[2] has some letters
  let part2 = parts[2];
  part2 = part2.substring(0, 2) + 'fg' + part2.substring(4);
  
  // Ensure parts[3] has some letters
  let part3 = parts[3];
  part3 = 'hij' + part3.substring(3);
  
  // Ensure parts[4] has some letters
  let part4 = parts[4];
  part4 = 'klmno' + part4.substring(5);
  
  return `${part0}-${parts[1]}-${part2}-${part3}-${part4}`;
}