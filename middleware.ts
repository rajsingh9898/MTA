import { NextResponse, type NextRequest } from "next/server"

// ─── Security: Base headers applied to every response ───────────────────────
const BASE_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "X-DNS-Prefetch-Control": "off",
  "X-Permitted-Cross-Domain-Policies": "none",
  // Security: Content-Security-Policy — prevents XSS by restricting resource origins
  // img-src includes unsplash (used for destination photos) and data: URIs
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev; tighten for prod with nonces
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https://images.unsplash.com https://source.unsplash.com data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
}

// Security: Maximum allowed request body size in bytes (100 KB)
const MAX_BODY_BYTES = 100 * 1024

// Security: HTTP methods that mutate state — require CSRF origin check
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export function middleware(request: NextRequest) {
  const { pathname, protocol, origin: requestOrigin } = request.nextUrl
  const method = request.method.toUpperCase()

  // ── 1. DoS: Body-size guard via Content-Length header ──────────────────────
  // Actual body is not readable in middleware, but Content-Length gives us a
  // fast gate before the route handler is invoked.
  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { message: "Request body too large. Maximum allowed size is 100 KB." },
      { status: 413 }
    )
  }

  // ── 2. CSRF: Origin check on mutating API requests ─────────────────────────
  // SameSite=Strict cookie is the primary defence; this is a belt-and-suspenders
  // server-side check that works even on older browsers.
  if (MUTATING_METHODS.has(method) && pathname.startsWith("/api/")) {
    const appOrigin = requestOrigin // e.g. "https://mysite.com"
    const originHeader = request.headers.get("origin")
    const refererHeader = request.headers.get("referer")

    // Allow requests that come from our own origin or have no Origin at all
    // (same-origin requests from server-side fetches may omit Origin).
    const isValidOrigin =
      !originHeader || // server-side / curl without Origin is fine
      originHeader === appOrigin ||
      // Allow localhost in development
      (process.env.NODE_ENV === "development" &&
        (originHeader.startsWith("http://localhost") || originHeader.startsWith("http://127.0.0.1")))

    const isValidReferer =
      !refererHeader || // no referer is fine
      refererHeader.startsWith(appOrigin) ||
      (process.env.NODE_ENV === "development" &&
        (refererHeader.startsWith("http://localhost") || refererHeader.startsWith("http://127.0.0.1")))

    if (!isValidOrigin || !isValidReferer) {
      return NextResponse.json(
        { message: "Forbidden: Cross-origin request blocked." },
        { status: 403 }
      )
    }
  }

  // ── 3. Attach request ID for tracing ───────────────────────────────────────
  const requestHeaders = new Headers(request.headers)
  if (!requestHeaders.has("x-request-id")) {
    requestHeaders.set("x-request-id", crypto.randomUUID())
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // ── 4. Apply security headers to every response ────────────────────────────
  for (const [key, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  // HSTS — only over HTTPS (production)
  if (protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    )
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}