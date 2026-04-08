import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key"

// Security: Maximum input lengths to prevent DoS attacks
const MAX_USERNAME_LENGTH = 255
const MAX_PASSWORD_LENGTH = 255

/**
 * Sanitize input to remove potentially harmful characters
 * Prisma queries are parameterized, so SQL injection is mitigated.
 * We still sanitize/validate to block malformed payloads.
 */
function sanitizeInput(input: string): string {
    // Remove null bytes and other control characters
    return input.replace(/[\0\x1b]/g, "")
}

// Security: 1-second artificial delay on failed auth (slows brute-force bots)
async function secureDelay() {
    await new Promise((resolve) => setTimeout(resolve, 1000))
}

export async function POST(request: NextRequest) {
    try {
        // Security: Brute-force rate limiting — 5 attempts per IP per 15 minutes
        const rateLimitKey = getRateLimitKey(request, "admin-login")
        const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many login attempts. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(rateLimit.retryAfterSeconds),
                        "X-RateLimit-Limit": "5",
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + rateLimit.retryAfterSeconds),
                    },
                }
            )
        }

        // Security: Check content type
        const contentType = request.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
            return NextResponse.json(
                { message: "Content-Type must be application/json" },
                { status: 400 }
            )
        }

        const body = await request.json()
        let { username, password } = body

        // Type validation
        if (typeof username !== "string" || typeof password !== "string") {
            return NextResponse.json(
                { message: "Invalid input format" },
                { status: 400 }
            )
        }

        // Validate inputs are not empty
        if (!username || !password) {
            return NextResponse.json(
                { message: "Username and password are required" },
                { status: 400 }
            )
        }

        // Security: Enforce maximum input lengths to prevent DoS
        if (username.length > MAX_USERNAME_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
            return NextResponse.json(
                { message: "Input exceeds maximum allowed length" },
                { status: 400 }
            )
        }

        // Security: Sanitize inputs (prevent null bytes, control characters)
        username = sanitizeInput(username)
        password = sanitizeInput(password)

        const adminCredential = await prisma.adminCredential.findFirst({
            where: {
                username,
                isActive: true,
            },
        })

        if (!adminCredential) {
            // Security: Artificial delay even when user not found (prevents timing-based enumeration)
            await secureDelay()
            return NextResponse.json(
                { message: "Invalid username or password" },
                { status: 401 }
            )
        }

        const passwordMatch = await bcrypt.compare(password, adminCredential.passwordHash)

        if (passwordMatch) {
            // Create JWT token
            const token = jwt.sign(
                { 
                    username: adminCredential.username,
                    role: "admin",
                    iat: Math.floor(Date.now() / 1000),
                },
                JWT_SECRET,
                { expiresIn: "24h" }
            )

            // Create response with httpOnly cookie
            const response = NextResponse.json(
                { 
                    message: "Admin login successful",
                    success: true,
                },
                { status: 200 }
            )

            // Set httpOnly cookie with the JWT token
            response.cookies.set({
                name: "admin_token",
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 24 * 60 * 60, // 24 hours
                path: "/",
            })

            return response
        } else {
            // Security: Artificial delay on wrong password (slows brute-force; bcrypt already ran)
            await secureDelay()
            return NextResponse.json(
                { message: "Invalid username or password" },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error("Admin login error:", error)
        // Security: Don't leak error details to client
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
