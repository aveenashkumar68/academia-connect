import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// ── SendGrid configuration ──────────────────────────────────────────────
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@projectmayaa.com';
const FROM_NAME = process.env.FROM_NAME || 'Project Mayaa';

if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not set. Emails will NOT be sent.');
} else {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('SendGrid configured successfully');
}

// console.log('Email Config:', {
//     from: `${FROM_NAME} <${FROM_EMAIL}>`,
//     apiKey: SENDGRID_API_KEY ? '****' + SENDGRID_API_KEY.slice(-4) : '⚠️ MISSING',
// });

/**
 * Send credentials email (awaitable — returns true/false).
 */
export const sendCredentialsEmail = async (to, role, email, password) => {
    if (!SENDGRID_API_KEY) {
        console.error('Cannot send email — SENDGRID_API_KEY is not configured.');
        return false;
    }

    try {
        console.log(`Sending credentials email to ${to} via SendGrid...`);

        const msg = {
            to,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            subject: `Your ${role} Account Credentials`,
            text: [
                'Hello,',
                '',
                'Congratulations! You are now a member of Project Mayaa.',
                '',
                `Email:    ${email}`,
                `Password: ${password}`,
                '',
                'Please login to access your account.',
                '',
                'Thanks,',
                'Project Mayaa Team',
            ].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Welcome to Project Mayaa!</h2>
                    <p>Congratulations! You are now a member of Project Mayaa. Here are your login credentials:</p>
                    <table style="border-collapse: collapse; margin: 16px 0;">
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Email</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Password</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${password}</td>
                        </tr>
                    </table>
                    <p>Please login to access your account and change your password.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 12px;">This is an automated message from Project Mayaa. Do not reply to this email.</p>
                </div>
            `,
        };

        await sgMail.send(msg);
        console.log('Email sent successfully to', to);
        return true;
    } catch (error) {
        // SendGrid errors have a response body with details
        const details = error.response?.body?.errors
            ? error.response.body.errors.map((e) => e.message).join('; ')
            : error.message;
        console.error('SendGrid error sending to', to, ':', details);
        return false;
    }
};

/**
 * Fire-and-forget email sending — does NOT block the caller.
 * Logs success/failure in the background.
 */
export const sendCredentialsEmailAsync = (to, role, email, password) => {
    // Intentionally not awaited — runs in background
    sendCredentialsEmail(to, role, email, password)
        .then((sent) => {
            if (!sent) {
                console.error(`Background email to ${to} failed. User was created but credentials were not emailed.`);
            }
        })
        .catch((err) => {
            console.error(`Background email to ${to} threw:`, err.message);
        });
};
