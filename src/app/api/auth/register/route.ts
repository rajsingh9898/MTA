import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    phoneNumber: z.string().min(10, "Phone number is required"),
    city: z.string().min(2, "City is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, phoneNumber, city, password } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            if (existingUser.isVerified) {
                return NextResponse.json(
                    { message: "User already exists" },
                    { status: 409 }
                )
            } else {
                // User exists but is not verified. Update password and resend OTP.
                const hashedPassword = await bcrypt.hash(password, 10)
                const otp = Math.floor(100000 + Math.random() * 900000).toString()
                const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

                // Update user and OTP
                await prisma.$transaction(async (tx) => {
                    await tx.user.update({
                        where: { email },
                        data: {
                            name,
                            phoneNumber,
                            city,
                            passwordHash: hashedPassword,
                        },
                    })

                    // Delete old OTPs
                    await tx.otp.deleteMany({
                        where: { email },
                    })

                    // Create new OTP
                    await tx.otp.create({
                        data: {
                            email,
                            code: otp,
                            expiresAt: otpExpiresAt,
                        },
                    })
                })

                // Send OTP email
                const { sendOtpEmail } = await import("@/lib/nodemailer")
                await sendOtpEmail(email, otp)

                return NextResponse.json(
                    { message: "Verification code sent again.", email },
                    { status: 200 }
                )
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Transaction to create user and OTP
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    phoneNumber,
                    city,
                    passwordHash: hashedPassword,
                    isVerified: false,
                },
            })

            await tx.otp.create({
                data: {
                    email,
                    code: otp,
                    expiresAt: otpExpiresAt,
                },
            })

            return user
        })

        // Send OTP email (non-blocking)
        // We import dynamically to avoid circular deps if any, but standard import is fine
        // Assuming sendOtpEmail is in lib/nodemailer
        const { sendOtpEmail } = await import("@/lib/nodemailer")
        await sendOtpEmail(email, otp)

        return NextResponse.json(
            { message: "Registration successful. Please verify your email.", email: result.email },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            )
        }
        console.error("Registration error:", error)
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        )
    }
}
