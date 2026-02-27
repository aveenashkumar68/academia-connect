import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter with timeouts to prevent hanging on Render
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Force IPv4 — many cloud providers (Render, Railway, etc.) don't support IPv6
    family: 4,
    // Timeouts to prevent hanging on cloud deployments
    connectionTimeout: 10000,  // 10 seconds to establish connection
    greetingTimeout: 10000,    // 10 seconds for greeting
    socketTimeout: 15000,      // 15 seconds for socket inactivity
    // Connection pool for better performance
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
});

// Verify SMTP connection on startup
transporter.verify()
    .then(() => console.log('✅ SMTP connection verified successfully'))
    .catch((err) => console.error('❌ SMTP connection failed:', err.message,
        '\n   Check that SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS env vars are set correctly.'));

/**
 * Send credentials email (awaitable — returns true/false).
 */
export const sendCredentialsEmail = async (to, role, email, password) => {
    try {
        console.log(`📧 Attempting to send credentials email to ${to}...`);

        const info = await transporter.sendMail({
            from: `"Project Mayaa" <${process.env.FROM_EMAIL || 'no-reply@example.com'}>`,
            to,
            subject: `Your ${role} Account Credentials`,
            text: `Hello,\n\nCongratulations you are a member of project mayaa and your user id and password is this:\nEmail: ${email}\nPassword: ${password}\n\nPlease login to access your account.\n\nThanks,\nProject Mayaa Team`,
            html: `
        <h3>Welcome to Project Mayaa!</h3>
        <p>Congratulations you are a member of project mayaa and your user id and password is this:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
      `,
        });

        console.log('✅ Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email to', to, ':', error.message);
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
                console.error(`⚠️ Background email to ${to} failed. User was created but credentials were not emailed.`);
            }
        })
        .catch((err) => {
            console.error(`⚠️ Background email to ${to} threw:`, err.message);
        });
};
