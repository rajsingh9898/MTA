import { prisma } from "@/lib/prisma"

export type OtpType = "GENERAL" | "ACCOUNT_CREATION" | "PASSWORD_RESET"

export interface OtpRequest {
  email: string
  type: OtpType
}

export interface OtpVerification {
  email: string
  code: string
  type: OtpType
}

// Generate a 6-digit OTP
function generateSixDigitOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Check if OTP exists and is valid
async function getExistingOtp(email: string, type: OtpType) {
  const existingOtp = await prisma.$queryRaw`
    SELECT * FROM otps 
    WHERE email = ${email.toLowerCase()} 
    AND type = ${type}
    AND is_used = false 
    AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1
  ` as any[]

  return existingOtp[0] || null
}

// Check if user can request new OTP (10-minute cooldown)
async function canRequestNewOtp(email: string, type: OtpType): Promise<{ canRequest: boolean; existingOtp?: any; reason?: string }> {
  const existingOtp = await getExistingOtp(email, type)
  
  if (!existingOtp) {
    return { canRequest: true }
  }

  const now = new Date()
  const otpAge = now.getTime() - existingOtp.createdAt.getTime()
  const tenMinutes = 10 * 60 * 1000

  if (otpAge < tenMinutes) {
    const remainingTime = Math.ceil((tenMinutes - otpAge) / (60 * 1000))
    return {
      canRequest: false,
      existingOtp,
      reason: `Please wait ${remainingTime} minutes before requesting a new OTP.`
    }
  }

  return { canRequest: true }
}

// Generate and send OTP
export async function generateAndSendOTP(request: OtpRequest): Promise<{ success: boolean; message: string; otpCode?: string }> {
  const { email, type } = request
  
  // Check if user can request new OTP
  const otpCheck = await canRequestNewOtp(email, type)
  
  if (!otpCheck.canRequest) {
    // If existing OTP is still valid, resend the same one
    if (otpCheck.existingOtp) {
      console.log(`Resending existing OTP for ${email} (${type})`)
      // TODO: Send email with existing OTP
      // await sendOTPEmail(email, otpCheck.existingOtp.code, type)
      
      return {
        success: true,
        message: "OTP resent successfully. Please check your email.",
        otpCode: otpCheck.existingOtp.code
      }
    }
    
    return {
      success: false,
      message: otpCheck.reason || "Cannot request OTP at this time."
    }
  }

  // Generate new OTP
  const otpCode = generateSixDigitOTP()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiry

  try {
    // Clean up old OTPs for this email and type
    await prisma.$executeRaw`
      DELETE FROM otps 
      WHERE email = ${email.toLowerCase()} 
      AND type = ${type}
      AND (expires_at < NOW() OR is_used = true)
    `

    // Create new OTP
    const otp = await prisma.$queryRaw`
      INSERT INTO otps (id, email, code, type, expires_at, created_at, is_used)
      VALUES (gen_random_uuid(), ${email.toLowerCase()}, ${otpCode}, ${type}, ${expiresAt}, NOW(), false)
      RETURNING *
    ` as any[]

    console.log(`Generated new OTP for ${email} (${type}): ${otpCode}`)
    
    // TODO: Send email with new OTP
    // await sendOTPEmail(email, otpCode, type)
    
    return {
      success: true,
      message: "OTP sent successfully. Please check your email.",
      otpCode: otpCode
    }

  } catch (error) {
    console.error("Error generating OTP:", error)
    return {
      success: false,
      message: "Failed to generate OTP. Please try again."
    }
  }
}

// Verify OTP
export async function verifyOTP(verification: OtpVerification): Promise<{ success: boolean; message: string; otp?: any }> {
  const { email, code, type } = verification

  try {
    const otps = await prisma.$queryRaw`
      SELECT * FROM otps 
      WHERE email = ${email.toLowerCase()} 
      AND code = ${code}
      AND type = ${type}
      AND is_used = false 
      AND expires_at > NOW()
      ORDER BY created_at DESC 
      LIMIT 1
    ` as any[]

    const otp = otps[0]
    if (!otp) {
      return {
        success: false,
        message: "Invalid or expired OTP. Please request a new one."
      }
    }

    // Mark OTP as used
    await prisma.$executeRaw`
      UPDATE otps 
      SET is_used = true, used_at = NOW()
      WHERE id = ${otp.id}
    `

    console.log(`OTP verified for ${email} (${type})`)
    
    return {
      success: true,
      message: "OTP verified successfully.",
      otp: otp
    }

  } catch (error) {
    console.error("Error verifying OTP:", error)
    return {
      success: false,
      message: "Failed to verify OTP. Please try again."
    }
  }
}

// Clean up expired OTPs (can be called periodically)
export async function cleanupExpiredOTPs() {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM otps 
      WHERE expires_at < NOW() OR is_used = true
    `
    
    console.log(`Cleaned up ${result} expired/used OTPs`)
    return result
  } catch (error) {
    console.error("Error cleaning up OTPs:", error)
    return 0
  }
}

// Get remaining time for OTP cooldown
export async function getOTPCooldown(email: string, type: OtpType): Promise<{ canRequest: boolean; remainingMinutes?: number }> {
  const existingOtp = await getExistingOtp(email, type)
  
  if (!existingOtp) {
    return { canRequest: true }
  }

  const now = new Date()
  const otpAge = now.getTime() - existingOtp.createdAt.getTime()
  const tenMinutes = 10 * 60 * 1000

  if (otpAge < tenMinutes) {
    const remainingMinutes = Math.ceil((tenMinutes - otpAge) / (60 * 1000))
    return {
      canRequest: false,
      remainingMinutes
    }
  }

  return { canRequest: true }
}
