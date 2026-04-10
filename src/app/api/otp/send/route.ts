import { NextResponse } from "next/server"
import { generateAndSendOTP, OtpRequest } from "@/lib/otp"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, type }: OtpRequest = body

    if (!email || !type) {
      return NextResponse.json(
        { message: "Email and type are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      )
    }

    const result = await generateAndSendOTP({ email: email.toLowerCase(), type })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        // Don't return the OTP code in production
        ...(process.env.NODE_ENV === 'development' && { otpCode: result.otpCode })
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("OTP send error:", error)
    return NextResponse.json(
      { message: "Failed to send OTP. Please try again." },
      { status: 500 }
    )
  }
}
