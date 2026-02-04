import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Please enter a valid email"),
    phoneNumber: z.string().min(10, "Phone number is required"),
    city: z.string().min(2, "City is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, phoneNumber, city, password } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 409 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                phoneNumber,
                city,
                passwordHash: hashedPassword,
            },
        })

        return NextResponse.json(
            { user: { id: user.id, email: user.email } },
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
