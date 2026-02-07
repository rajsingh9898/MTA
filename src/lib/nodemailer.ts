import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

export async function sendOtpEmail(email: string, otp: string) {
    // Development fallback
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log('---------------------------------------------------');
        console.log(`[DEV MODE] Email to ${email} with OTP: ${otp}`);
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

    try {
        await transporter.sendMail({
            from: `"MTA Support" <${smtpUser}>`, // sender address
            to: email, // list of receivers
            subject: "Your Verification Code", // Subject line
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify Your Email</h2>
                    <p>Thank you for registering. Please use the following code to verify your email address:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                        ${otp}
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
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
