import { NextResponse } from "next/server"
import { verifyOTP, OtpVerification } from "@/lib/otp"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, code, type }: OtpVerification = body

    if (!email || !code || !type) {
      return NextResponse.json(
        { message: "Email, code, and type are required" },
        { status: 400 }
      )
    }

    const result = await verifyOTP({ 
      email: email.toLowerCase(), 
      code, 
      type 
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        // Return user info if needed for account creation
        ...(type === "ACCOUNT_CREATION" && { 
          canProceed: true,
          email: email 
        })
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error("OTP verification error:", error)
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    )
  }
}
