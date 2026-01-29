import { sendMail } from "../lib/mailer.js";

class EmailService {
    static async sendOtpEmail(email, otp) {
        const subject = "Verification OTP - SignPublicQ";
        const text = `Your verification code is: ${otp}. It is valid for 10 minutes.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Welcome to SignPublicQ!</h2>
                <p>Please use the following One Time Password (OTP) to verify your email address:</p>
                <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
                <p>This code is valid for 10 minutes.</p>
                <p>If you did not request this code, please ignore this email.</p>
            </div>
        `;

        try {
            await sendMail({ to: email, subject, text, html });
            return true;
        } catch (error) {
            console.error("Failed to send OTP email:", error);
            throw new Error("Failed to send verification email");
        }
    }

    static generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

export default EmailService;
