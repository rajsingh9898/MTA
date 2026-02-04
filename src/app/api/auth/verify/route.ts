import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifySchema = z.object({
    email: z.string().email("Invalid email"),
    otp: z.string().length(6, "OTP must be 6 digits"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, otp } = verifySchema.parse(body)

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            )
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: "User already verified" },
                { status: 200 }
            )
        }

        // Check OTP
        if (user.otp !== otp) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            )
        }

        // Check Expiry
        if (!user.otpExpires || new Date() > user.otpExpires) {
            return NextResponse.json(
                { message: "OTP expired" },
                { status: 400 }
            )
        }

        // Verify User
        await prisma.user.update({
            where: { email },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null,
            },
        })

        return NextResponse.json(
            { message: "Email verified successfully" },
            { status: 200 }
        )

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            )
        }
        console.error("Verification error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
