import { Resend } from "resend"
import { env } from "@/lib/env"
import { createLogger } from "@/lib/logger"

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
const logger = createLogger("email")

export async function sendOtpEmail(email: string, otp: string) {
    if (!resend) {
        logger.info(`Resend is disabled; skipping OTP delivery for ${email}`)
        return
    }

    try {
        await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Your Verification Code",
            html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        })
    } catch (error) {
        logger.error("Failed to send email", error)
    }
}
