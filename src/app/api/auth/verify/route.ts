import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifySchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, otp } = verifySchema.parse(body)

        const existingOtp = await prisma.otp.findFirst({
            where: {
                email,
                code: otp,
            },
        })

        if (!existingOtp) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            )
        }

        if (existingOtp.expiresAt < new Date()) {
            await prisma.otp.delete({
                where: {
                    id: existingOtp.id
                }
            })
            return NextResponse.json(
                { message: "OTP has expired" },
                { status: 400 }
            )
        }

        // Verify user and delete OTP
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { email },
                data: {
                    isVerified: true,
                },
            })

            await tx.otp.deleteMany({
                where: { email },
            })
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
