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
