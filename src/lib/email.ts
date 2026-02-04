import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOtpEmail(email: string, otp: string) {
    if (!resend) {
        console.log('---------------------------------------------------');
        console.log(`[DEV MODE] Email to ${email} with OTP: ${otp}`);
        console.log('---------------------------------------------------');
        return;
    }

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Your Verification Code',
            html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        // Fallback to console for dev if email fails (e.g. unverified domain)
        console.log(`[FALLBACK] Email to ${email} with OTP: ${otp}`);
    }
}
