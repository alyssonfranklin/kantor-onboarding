import crypto from 'crypto';

/**
 * Generates an ID in the format: mxy9t357-6789-ghij-klm3-nopqr678901
 * Each part of the ID follows a consistent pattern with a mix of letters and numbers
 */
export async function generateId(prefix: string): Promise<string> {
  // Create a UUID-like structure but with the specified pattern
  const part1 = generateCustomPart('mxy9t357');
  const part2 = '6789';
  const part3 = 'ghij';
  const part4 = 'klm3';
  const part5 = 'nopqr678901';
  
  // Combine parts with hyphens
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Generates a custom part of an ID with the same character types (letter/number) as the pattern
 */
function generateCustomPart(pattern: string): string {
  let result = '';
  
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    
    if (/[a-z]/.test(char)) {
      // Random lowercase letter
      result += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    } else if (/[0-9]/.test(char)) {
      // Random digit
      result += Math.floor(Math.random() * 10).toString();
    } else {
      // Keep any other character as is
      result += char;
    }
  }
  
  return result;
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