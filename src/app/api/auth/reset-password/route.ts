import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const resetPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, otp, newPassword } = resetPasswordSchema.parse(body)

        // Verify OTP
        const validOtp = await prisma.otp.findFirst({
            where: {
                email,
                code: otp,
                expiresAt: {
                    gt: new Date(),
                },
            },
        })

        if (!validOtp) {
            return NextResponse.json(
                { message: "Invalid or expired verification code" },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update user password
        await prisma.user.update({
            where: { email },
            data: {
                passwordHash: hashedPassword,
            },
        })

        // Delete used OTP
        await prisma.otp.delete({
            where: { id: validOtp.id },
        })

        return NextResponse.json(
            { message: "Password reset successfully" },
            { status: 200 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            )
        }
        console.error("Reset password error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
