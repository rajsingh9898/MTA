import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"

// Security settings for authentication
export const AUTH_RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  REGISTER: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  OTP: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 OTP requests per 10 minutes
}

export function enforceAuthRateLimit(
  request: NextRequest,
  type: keyof typeof AUTH_RATE_LIMITS
): NextResponse | null {
  const { limit, windowMs } = AUTH_RATE_LIMITS[type]
  const rateLimitKey = getRateLimitKey(request, `auth-${type}`)
  const rateLimit = checkRateLimit(rateLimitKey, limit, windowMs)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        message: "Too many attempts. Please try again later.",
        error: "RATE_LIMIT_EXCEEDED"
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + rateLimit.retryAfterSeconds),
        },
      }
    )
  }

  return null
}

// Function to log security events
export function logSecurityEvent(
  type: string,
  details: Record<string, any>,
  request: Request | NextRequest
) {
  const timestamp = new Date().toISOString()
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip")?.trim() || 
             "unknown"
  
  console.warn(`[SECURITY] ${type} - ${timestamp} - IP: ${ip}`, details)
}

// Function to detect suspicious patterns
export function detectSuspiciousActivity(
  request: Request | NextRequest,
  type: string
): boolean {
  const userAgent = request.headers.get("user-agent") || ""
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
             request.headers.get("x-real-ip")?.trim() || ""

  // Detect common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ]

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent("BOT_DETECTED", { type, userAgent }, request)
    return true
  }

  // Detect suspicious IP patterns (you can add more sophisticated checks)
  if (ip.includes("127.0.0.1") || ip.includes("localhost")) {
    // Allow localhost for development
    return false
  }

  return false
}
