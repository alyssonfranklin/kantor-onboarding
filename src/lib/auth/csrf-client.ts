"use client";

/**
 * Client-Side CSRF Protection
 * 
 * Provides utilities for Cross-Site Request Forgery protection
 * on the client side.
 */

import { CSRF_TOKEN_NAME } from './constants';
import { getCsrfCookie } from './cookies-client';

/**
 * Client-side CSRF token utility for adding tokens to requests
 */
export const clientCsrf = {
  /**
   * Get the CSRF token from cookie for client-side use
   */
  getToken(): string | undefined {
    return getCsrfCookie();
  },
  
  /**
   * Add CSRF token to fetch headers
   */
  addToHeaders(headers: HeadersInit = {}): Headers {
    const newHeaders = new Headers(headers);
    const token = this.getToken();
    
    if (token) {
      newHeaders.set('X-CSRF-Token', token);
    }
    
    return newHeaders;
  },
  
  /**
   * Add CSRF token to form data
   */
  addToFormData(formData: FormData): FormData {
    const token = this.getToken();
    if (token) {
      formData.append('_csrf', token);
    }
    return formData;
  },
  
  /**
   * Get a hidden input field with the CSRF token
   */
  hiddenField(): JSX.Element | null {
    const token = this.getToken();
    if (!token) return null;
    
    // We need to use React for this to be used in JSX
    const React = require('react');
    return React.createElement('input', {
      type: 'hidden',
      name: '_csrf',
      value: token
    });
  }
};