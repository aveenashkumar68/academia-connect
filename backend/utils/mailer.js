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
}

/**
 * Send credentials email (awaitable — returns true/false).
 */
export const sendCredentialsEmail = async (to, role, email, password, department, domain, name = 'User') => {
    if (!SENDGRID_API_KEY) {
        console.error('Cannot send email — SENDGRID_API_KEY is not configured.');
        return false;
    }

    try {
        const msg = {
            to,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            replyTo: { email: FROM_EMAIL, name: FROM_NAME },
            subject: `Your ${role} Account Credentials`,
            text: [
                `Dear ${name},`,
                '',
                'Greetings from Team Project Mayaa.',
                '',
                'We are pleased to provide you with your access credentials for Project Mayaa. Please find your login details below:',
                '',
                `Role:       ${role}`,
                `Department: ${department || 'N/A'}`,
                `Domain:     ${domain || 'N/A'}`,
                `Email:      ${email}`,
                `Password:   ${password}`,
                '',
                'Project Mayaa Live Link: https://academia-connect-three.vercel.app/',
                '',
                'For security purposes, we strongly recommend that you keep these credentials confidential and avoid sharing them with unauthorized individuals. If this is your first time logging in, please consider updating your password after accessing the system.',
                '',
                'In case you encounter any issues while accessing the platform or require any assistance, please contact our support team (projectmayaaexcelcolleges@gmail.com).',
                '',
                'Warm regards,',
                'Team Project Mayaa',
            ].join('\n'),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p style="margin-top: 0;">Dear ${name},</p>
                    <p>Greetings from Team Project Mayaa.</p>
                    <p>We are pleased to provide you with your access credentials for Project Mayaa. Please find your login details below:</p>
                    <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Role</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${role}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Department</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${department || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Domain</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${domain || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Email</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 16px; font-weight: bold; background: #f1f5f9;">Password</td>
                            <td style="padding: 8px 16px; background: #f8fafc;">${password}</td>
                        </tr>
                    </table>
                    <p style="margin: 16px 0;"><strong>Project Mayaa Live Link:</strong> <a href="https://academia-connect-three.vercel.app/" style="font-weight: bold; color: #2563eb; text-decoration: none;">https://academia-connect-three.vercel.app/</a></p>
                    <p>For security purposes, we strongly recommend that you keep these credentials confidential and avoid sharing them with unauthorized individuals. If this is your first time logging in, please consider updating your password after accessing the system.</p>
                    <p>In case you encounter any issues while accessing the platform or require any assistance, please contact our support team (<a href="mailto:projectmayaaexcelcolleges@gmail.com" style="color: #2563eb; text-decoration: none;">projectmayaaexcelcolleges@gmail.com</a>).</p>
                    <p>Warm regards,<br>Team Project Mayaa</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 12px;">This is an automated message from Project Mayaa. Do not reply to this email.</p>
                </div>
            `,
        };

        const [response] = await sgMail.send(msg);
        const statusCode = response.statusCode;
        if (statusCode !== 202) {
            console.error(`Unexpected SendGrid status ${statusCode} for ${to}. Email may not be delivered.`);
        }

        return true;
    } catch (error) {
        // SendGrid errors have a response body with details
        const statusCode = error.code || error.response?.statusCode;
        const details = error.response?.body?.errors
            ? error.response.body.errors.map((e) => e.message).join('; ')
            : error.message;
        console.error(`SendGrid error [${statusCode}] sending to ${to}:`, details);
        return false;
    }
};

/**
 * Fire-and-forget email sending — does NOT block the caller.
 * Logs success/failure in the background.
 */
export const sendCredentialsEmailAsync = (to, role, email, password, department, domain, name = 'User') => {
    // Intentionally not awaited — runs in background
    sendCredentialsEmail(to, role, email, password, department, domain, name)
        .then((sent) => {
            if (!sent) {
                console.error(`Background email to ${to} failed. User was created but credentials were not emailed.`);
            }
        })
        .catch((err) => {
            console.error(`Background email to ${to} threw:`, err.message);
        });
};

/**
 * Send a password-reset OTP email.
 */
export const sendPasswordResetOTP = async (to, name, otp) => {
    if (!SENDGRID_API_KEY) {
        console.error('Cannot send OTP email — SENDGRID_API_KEY is not configured.');
        return false;
    }
    try {
        console.log(`Sending password reset OTP to ${to}...`);
        const msg = {
            to,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            replyTo: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Password Reset OTP — Project Mayaa',
            text: `Dear ${name},\n\nYour One-Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.\n\nIf you did not request a password reset, please ignore this email.\n\nWarm regards,\nTeam Project Mayaa`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p style="margin-top: 0;">Dear ${name},</p>
                    <p>We received a request to reset your password for your <strong>Project Mayaa</strong> account.</p>
                    <p style="margin: 20px 0;">Your One-Time Password (OTP) is:</p>
                    <div style="text-align: center; margin: 24px 0;">
                        <span style="display: inline-block; font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #10B981; background: #f0fdf4; border: 2px dashed #10B981; border-radius: 12px; padding: 16px 32px;">${otp}</span>
                    </div>
                    <p style="color: #dc2626; font-weight: 500;">⏱ This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
                    <p>If you did not request a password reset, please ignore this email. Your account is safe.</p>
                    <p>Warm regards,<br>Team Project Mayaa</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 12px;">This is an automated message from Project Mayaa. Do not reply to this email.</p>
                </div>
            `,
        };
        const [response] = await sgMail.send(msg);
        console.log(`OTP email sent to ${to} (status: ${response.statusCode})`);
        return true;
    } catch (error) {
        const statusCode = error.code || error.response?.statusCode;
        const details = error.response?.body?.errors
            ? error.response.body.errors.map((e) => e.message).join('; ')
            : error.message;
        console.error(`SendGrid OTP error [${statusCode}] sending to ${to}:`, details);
        return false;
    }
};

/**
 * Send a password-reset confirmation email.
 */
export const sendPasswordResetConfirmation = async (to, name) => {
    if (!SENDGRID_API_KEY) {
        console.error('Cannot send confirmation email — SENDGRID_API_KEY is not configured.');
        return false;
    }
    try {
        console.log(`Sending password reset confirmation to ${to}...`);
        const msg = {
            to,
            from: { email: FROM_EMAIL, name: FROM_NAME },
            replyTo: { email: FROM_EMAIL, name: FROM_NAME },
            subject: 'Password Changed Successfully — Project Mayaa',
            text: `Dear ${name},\n\nYour password for Project Mayaa has been successfully changed.\n\nIf you made this change, no further action is required.\n\nIf you did NOT change your password, please contact our support team immediately at projectmayaaexcelcolleges@gmail.com.\n\nWarm regards,\nTeam Project Mayaa`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <p style="margin-top: 0;">Dear ${name},</p>
                    <p>Your password for <strong>Project Mayaa</strong> has been <span style="color: #10B981; font-weight: 600;">successfully changed</span>.</p>
                    <div style="background: #f0fdf4; border-left: 4px solid #10B981; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0;">
                        <p style="margin: 0; font-weight: 500;">✅ Your password was updated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.</p>
                    </div>
                    <p>If you made this change, no further action is required.</p>
                    <p style="color: #dc2626;">If you did <strong>NOT</strong> change your password, please contact our support team immediately at <a href="mailto:projectmayaaexcelcolleges@gmail.com" style="color: #2563eb;">projectmayaaexcelcolleges@gmail.com</a>.</p>
                    <p>Warm regards,<br>Team Project Mayaa</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="color: #64748b; font-size: 12px;">This is an automated message from Project Mayaa. Do not reply to this email.</p>
                </div>
            `,
        };
        const [response] = await sgMail.send(msg);
        console.log(`Confirmation email sent to ${to} (status: ${response.statusCode})`);
        return true;
    } catch (error) {
        const statusCode = error.code || error.response?.statusCode;
        const details = error.response?.body?.errors
            ? error.response.body.errors.map((e) => e.message).join('; ')
            : error.message;
        console.error(`SendGrid confirmation error [${statusCode}] sending to ${to}:`, details);
        return false;
    }
};
