import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} content - The HTML content to sanitize
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML content
 */
export function sanitizeHtml(content, options = {}) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ...options
  };

  try {
    return DOMPurify.sanitize(content, defaultOptions);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return '';
  }
}

/**
 * Sanitize plain text content
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize URL
 * @param {string} url - The URL to validate and sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    return urlObj.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize object properties recursively
 * @param {object} obj - The object to sanitize
 * @param {Array} textFields - Fields that should be treated as text
 * @param {Array} htmlFields - Fields that should be treated as HTML
 * @param {Array} urlFields - Fields that should be treated as URLs
 * @returns {object} - Sanitized object
 */
export function sanitizeObject(obj, textFields = [], htmlFields = [], urlFields = []) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      if (htmlFields.includes(key)) {
        sanitized[key] = sanitizeHtml(value);
      } else if (urlFields.includes(key)) {
        sanitized[key] = sanitizeUrl(value);
      } else if (textFields.includes(key)) {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, textFields, htmlFields, urlFields);
    }
  }

  return sanitized;
}