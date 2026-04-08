import nodemailer from "nodemailer"
import { env } from "@/lib/env"
import { createLogger } from "@/lib/logger"

const smtpHost = env.SMTP_HOST
const smtpPort = env.SMTP_PORT ?? 587
const smtpUser = env.SMTP_USER
const smtpPass = env.SMTP_PASS
const logger = createLogger("nodemailer")

export async function sendOtpEmail(email: string, otp: string, type: "verification" | "reset" = "verification") {
    // Development fallback
    if (!smtpHost || !smtpUser || !smtpPass) {
        logger.info(`SMTP is disabled; skipping ${type} email delivery for ${email}`)
        return
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    })

    const subject = type === "reset" ? "Reset Your Password" : "Your Verification Code"
    const title = type === "reset" ? "Reset Your Password" : "Verify Your Email"
    const message = type === "reset"
        ? "You requested a password reset. Please use the following code to reset your password:"
        : "Thank you for registering. Please use the following code to verify your email address:"

    try {
        await transporter.sendMail({
            from: `"MTA Support" <${smtpUser}>`,
            to: email,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <p style="color: #555; font-weight: bold;"><b>This is system generated mail. Please do not reply it.</b></p>
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        ${otp}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
                        Thanks & Regards,<br>
                        MTA Team
                    </div>
                </div>
            `,
        })
    } catch (error) {
        logger.error("Failed to send email", error)
    }
}
