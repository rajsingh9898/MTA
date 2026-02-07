import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const verifySchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, otp } = verifySchema.parse(body)

        const otpRecord = await prisma.otp.findUnique({
            where: {
                email_code: {
                    email,
                    code: otp,
                },
            },
        })

        if (!otpRecord) {
            return NextResponse.json(
                { message: "Invalid OTP" },
                { status: 400 }
            )
        }

        if (otpRecord.expiresAt < new Date()) {
            await prisma.otp.delete({
                where: { id: otpRecord.id },
            })
            return NextResponse.json(
                { message: "OTP expired" },
                { status: 400 }
            )
        }

        // Verify user and delete OTP
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { email },
                data: { isVerified: true },
            })

            await tx.otp.delete({
                where: { id: otpRecord.id },
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
