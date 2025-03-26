/**
 * Utility for generating custom IDs with prefixes
 * Follows a specific format for consistency
 */

/**
 * Generate a unique ID with an optional prefix
 * Pattern: [prefix]xyx0a000-0000-abcd-0000-abcdef000000
 * Where:
 * - [prefix] is an optional 4-letter prefix
 * - x, y, z, a, b, c, d, e, f are random alphanumeric characters
 * - 0 is a random digit
 * 
 * @param {String} prefix - Optional prefix for the ID (e.g., 'USER', 'COMP')
 * @returns {String} Generated ID
 */
const generateId = async (prefix = '') => {
  // Characters to use for random parts
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  // Generate a random string of specified length
  const randomString = (length) => {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  // Generate the ID parts
  const part1 = randomString(3) + Math.floor(Math.random() * 10) + randomString(1) + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 10);
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part3 = randomString(4);
  const part4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part5 = randomString(6) + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  // Combine parts with hyphens
  const id = `${part1}-${part2}-${part3}-${part4}-${part5}`;
  
  // Add prefix if provided
  return prefix ? `${prefix.toUpperCase()}_${id}` : id;
};

module.exports = { generateId };