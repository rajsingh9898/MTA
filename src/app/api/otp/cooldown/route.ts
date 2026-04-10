import { NextResponse } from "next/server"
import { getOTPCooldown, OtpType } from "@/lib/otp"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, type }: { email: string; type: OtpType } = body

    if (!email || !type) {
      return NextResponse.json(
        { message: "Email and type are required" },
        { status: 400 }
      )
    }

    const cooldown = await getOTPCooldown(email.toLowerCase(), type)

    return NextResponse.json({
      canRequest: cooldown.canRequest,
      remainingMinutes: cooldown.remainingMinutes,
      message: cooldown.canRequest 
        ? "You can request a new OTP" 
        : `Please wait ${cooldown.remainingMinutes} minutes before requesting a new OTP.`
    })

  } catch (error) {
    console.error("OTP cooldown check error:", error)
    return NextResponse.json(
      { message: "Failed to check OTP status. Please try again." },
      { status: 500 }
    )
  }
}
