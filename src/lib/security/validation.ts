import { z } from "zod"

// Security validation schemas
export const securitySchemas = {
  email: z.string()
    .email("Invalid email format")
    .max(254, "Email too long")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"),

  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),

  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),

  city: z.string()
    .max(100, "City name too long")
    .regex(/^[a-zA-Z\s'-]+$/, "City can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),

  phoneNumber: z.string()
    .regex(/^[+]?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .max(20, "Phone number too long")
    .optional(),

  // Sanitization functions
  sanitizeString: (input: string): string => {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JS injection
      .replace(/on\w+=/gi, '') // Remove event handlers
      .slice(0, 1000) // Limit length
  },

  sanitizeEmail: (email: string): string => {
    return email
      .toLowerCase()
      .trim()
      .slice(0, 254)
  },

  sanitizeName: (name: string): string => {
    return name
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[^a-zA-Z\s'-]/g, '') // Keep only valid characters
      .slice(0, 100)
  },

  sanitizeCity: (city: string): string => {
    return city
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[^a-zA-Z\s'-]/g, '') // Keep only valid characters
      .slice(0, 100)
  },

  sanitizePhoneNumber: (phone: string): string => {
    return phone
      .trim()
      .replace(/[^\d\s\+\-\(\)]/g, '') // Keep only phone number characters
      .slice(0, 20)
  }
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => err.message).join(', ')
      throw new Error(`Validation failed: ${errorMessage}`)
    }
    throw new Error('Validation failed')
  }
}

// XSS prevention
export function sanitizeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  }
  
  return input.replace(/[&<>"'/]/g, (m) => map[m])
}

// SQL injection prevention (additional layer)
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['"\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/;/g, '') // Remove semicolons
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b/gi, '') // Remove SQL keywords
    .trim()
    .slice(0, 255)
}

// Rate limiting for form submissions
const formSubmissionCache = new Map<string, { count: number; resetAt: number }>()

export function checkFormSubmissionRate(identifier: string, limit: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now()
  const existing = formSubmissionCache.get(identifier)

  if (!existing || existing.resetAt <= now) {
    formSubmissionCache.set(identifier, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (existing.count >= limit) {
    return false
  }

  existing.count++
  return true
}

// Content Security Policy helper
export function getCSPHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' https://images.unsplash.com https://source.unsplash.com data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  }
}
