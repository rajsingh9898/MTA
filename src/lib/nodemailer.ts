import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

export async function sendOtpEmail(email: string, otp: string, type: 'verification' | 'reset' = 'verification') {
    // Development fallback
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log('---------------------------------------------------');
        console.log(`[DEV MODE] ${type === 'reset' ? 'Password Reset' : 'Verification'} Email to ${email} with OTP: ${otp}`);
        console.log('---------------------------------------------------');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const subject = type === 'reset' ? "Reset Your Password" : "Your Verification Code";
    const title = type === 'reset' ? "Reset Your Password" : "Verify Your Email";
    const message = type === 'reset'
        ? "You requested a password reset. Please use the following code to reset your password:"
        : "Thank you for registering. Please use the following code to verify your email address:";

    try {
        await transporter.sendMail({
            from: `"MTA Support" <${smtpUser}>`, // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
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
        });
        console.log(`OTP sent to ${email}`);
    } catch (error) {
        console.error('Failed to send email:', error);
        // Fallback to console for dev if email fails
        console.log(`[FALLBACK] Email to ${email} with OTP: ${otp}`);
    }
}
