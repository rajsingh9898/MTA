import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendOtpEmail } from "@/lib/nodemailer"
import { checkRateLimit, getRateLimitKey } from "@/lib/rate-limit"

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
})

export async function POST(req: Request) {
    try {
        // Security: Rate limiting — 5 attempts per IP per 15 minutes
        const rateLimit = checkRateLimit(getRateLimitKey(req, "forgot-password"), 5, 15 * 60_000)
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { message: "Too many requests. Please try again later." },
                { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
            )
        }

        const body = await req.json()
        const { email } = forgotPasswordSchema.parse(body)

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            // Security: Return generic message to prevent email/username enumeration
            // (do NOT reveal that the email is not registered)
            return NextResponse.json(
                { message: "If an account exists with this email, a verification code has been sent." },
                { status: 200 }
            )
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Delete any existing OTPs for this email to keep it clean
        await prisma.otp.deleteMany({
            where: { email },
        })

        // Create new OTP
        await prisma.otp.create({
            data: {
                email,
                code: otp,
                expiresAt: otpExpiresAt,
            },
        })

        // Send email
        await sendOtpEmail(email, otp, "reset")

        return NextResponse.json(
            { message: "If an account exists with this email, a verification code has been sent." },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid email" },
                { status: 400 }
            )
        }
        console.error("Forgot password error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
