// src/lib/contactExtractor.ts

export interface ExtractedContact {
  email: string;
  context?: string;
}

export interface ContactExtractionResult {
  emails: string[];
  uniqueEmails: string[];
  totalFound: number;
  uniqueCount: number;
  isWithinRecommendedLimit: boolean;
  extractedContacts: ExtractedContact[];
  success: boolean;
  error?: string;
}

export class ContactExtractor {
  // Comprehensive email regex pattern (RFC 5322 compliant)
  private static readonly EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // More strict validation regex
  private static readonly STRICT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  
  // Common non-email patterns to exclude
  private static readonly EXCLUDE_PATTERNS = [
    /\.(png|jpg|jpeg|gif|svg|pdf|doc|docx)@/i,
    /@example\.(com|org|net)/i,
    /@(localhost|test|dummy)/i,
  ];

  private static readonly RECOMMENDED_LIMIT = 100;

  /**
   * Extract and validate emails from text content
   */
  static extractContacts(text: string): ContactExtractionResult {
    try {
      if (!text || text.trim().length === 0) {
        return {
          emails: [],
          uniqueEmails: [],
          totalFound: 0,
          uniqueCount: 0,
          isWithinRecommendedLimit: true,
          extractedContacts: [],
          success: true
        };
      }

      // Find all potential email matches
      const potentialEmails = text.match(this.EMAIL_REGEX) || [];
      
      // Filter and validate emails
      const validEmails: string[] = [];
      const extractedContacts: ExtractedContact[] = [];

      potentialEmails.forEach(email => {
        const cleanEmail = this.cleanEmail(email);
        
        if (this.isValidEmail(cleanEmail) && !this.shouldExclude(cleanEmail)) {
          validEmails.push(cleanEmail);
          
          // Try to extract context (surrounding text)
          const context = this.extractContext(text, email);
          extractedContacts.push({
            email: cleanEmail,
            context
          });
        }
      });

      // Remove duplicates while preserving first occurrence context
      const uniqueEmails = this.removeDuplicates(validEmails);
      const uniqueContacts = this.removeDuplicateContacts(extractedContacts);

      return {
        emails: validEmails,
        uniqueEmails,
        totalFound: validEmails.length,
        uniqueCount: uniqueEmails.length,
        isWithinRecommendedLimit: uniqueEmails.length <= this.RECOMMENDED_LIMIT,
        extractedContacts: uniqueContacts,
        success: true
      };

    } catch (error) {
      return {
        emails: [],
        uniqueEmails: [],
        totalFound: 0,
        uniqueCount: 0,
        isWithinRecommendedLimit: true,
        extractedContacts: [],
        success: false,
        error: `Contact extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Clean and normalize email address
   */
  private static cleanEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Validate email format using strict regex
   */
  private static isValidEmail(email: string): boolean {
    return this.STRICT_EMAIL_REGEX.test(email);
  }

  /**
   * Check if email should be excluded based on patterns
   */
  private static shouldExclude(email: string): boolean {
    return this.EXCLUDE_PATTERNS.some(pattern => pattern.test(email));
  }

  /**
   * Extract context around email
   */
  private static extractContext(text: string, email: string): string {
    try {
      const emailIndex = text.indexOf(email);
      if (emailIndex === -1) return '';

      const contextStart = Math.max(0, emailIndex - 100);
      const contextEnd = Math.min(text.length, emailIndex + email.length + 100);
      
      let context = text.substring(contextStart, contextEnd).trim();
      context = context.replace(/\s+/g, ' ').trim();
      
      if (context.length > 200) {
        const sentences = context.split(/[.!?]/);
        const emailSentenceIndex = sentences.findIndex(sentence => sentence.includes(email));
        
        if (emailSentenceIndex !== -1) {
          const start = Math.max(0, emailSentenceIndex - 1);
          const end = Math.min(sentences.length, emailSentenceIndex + 2);
          context = sentences.slice(start, end).join('. ').trim();
        }
      }

      return context;
    } catch (error) {
      return '';
    }
  }

  /**
   * Remove duplicate emails while preserving order
   */
  private static removeDuplicates(emails: string[]): string[] {
    return [...new Set(emails)];
  }

  /**
   * Remove duplicate contacts while preserving first occurrence
   */
  private static removeDuplicateContacts(contacts: ExtractedContact[]): ExtractedContact[] {
    const seen = new Set<string>();
    return contacts.filter(contact => {
      if (seen.has(contact.email)) {
        return false;
      }
      seen.add(contact.email);
      return true;
    });
  }

  /**
   * Get recommendation message based on email count
   */
  static getRecommendationMessage(emailCount: number): string | null {
    if (emailCount > this.RECOMMENDED_LIMIT) {
      return `File contains ${emailCount} emails. For optimal processing, consider splitting into files with ≤${this.RECOMMENDED_LIMIT} contacts each.`;
    }
    return null;
  }
}