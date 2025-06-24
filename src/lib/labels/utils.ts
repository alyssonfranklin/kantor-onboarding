/**
 * Utility functions for working with labels
 */

/**
 * Get a label with fallback support
 * @param labels - The labels object
 * @param key - The label key
 * @param fallback - Fallback text if key not found
 * @param replacements - Object with replacement values for placeholders
 * @returns The label text with replacements applied
 */
export function getLabel(
  labels: Record<string, string>,
  key: string,
  fallback?: string,
  replacements?: Record<string, string>
): string {
  let text = labels[key] || fallback || key;
  
  // Apply replacements for placeholders like {email}, {name}, etc.
  if (replacements) {
    Object.entries(replacements).forEach(([placeholder, value]) => {
      text = text.replace(new RegExp(`{${placeholder}}`, 'g'), value);
    });
  }
  
  return text;
}

/**
 * Check if a label key exists
 * @param labels - The labels object
 * @param key - The label key to check
 * @returns True if the label exists
 */
export function hasLabel(labels: Record<string, string>, key: string): boolean {
  return key in labels;
}

/**
 * Get multiple labels at once
 * @param labels - The labels object
 * @param keys - Array of label keys
 * @returns Object with requested labels
 */
export function getLabels(
  labels: Record<string, string>,
  keys: string[]
): Record<string, string> {
  return keys.reduce((result, key) => {
    result[key] = labels[key] || key;
    return result;
  }, {} as Record<string, string>);
}