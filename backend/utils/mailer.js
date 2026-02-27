import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Force Node.js DNS resolver to prefer IPv4 globally
// This prevents ENETUNREACH errors on cloud providers that lack IPv6
dns.setDefaultResultOrder('ipv4first');

// Build transport options — use Gmail service shortcut when applicable
const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');

const transportOptions = {
    // Force IPv4 at the socket level too
    family: 4,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // TLS options for cloud environments
    tls: {
        // Render's network may use intermediate proxies
        rejectUnauthorized: false,
    },
    // Timeouts to prevent hanging on cloud deployments
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    // Do NOT use pool — it causes issues with Gmail SSL on Render
};

if (isGmail) {
    // Use nodemailer's built-in Gmail service config (handles host/port/secure automatically)
    transportOptions.service = 'gmail';
} else {
    transportOptions.host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    transportOptions.port = parseInt(process.env.SMTP_PORT || '587');
    transportOptions.secure = process.env.SMTP_PORT === '465';
}

const transporter = nodemailer.createTransport(transportOptions);

// Log config on startup (mask password)
console.log('📧 SMTP Config:', {
    service: isGmail ? 'gmail' : undefined,
    host: isGmail ? '(gmail service)' : transportOptions.host,
    user: process.env.SMTP_USER || '⚠️ MISSING',
    pass: process.env.SMTP_PASS ? '****' : '⚠️ MISSING',
    from: process.env.FROM_EMAIL || '⚠️ MISSING',
});

// Verify SMTP connection on startup (non-fatal)
transporter.verify()
    .then(() => console.log('✅ SMTP connection verified successfully'))
    .catch((err) => console.error('❌ SMTP connection failed:', err.message,
        '\n   This is non-fatal — emails will be retried on each send attempt.',
        '\n   Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars on Render.'));

/**
 * Send credentials email (awaitable — returns true/false).
 */
export const sendCredentialsEmail = async (to, role, email, password) => {
    try {
        console.log(`📧 Attempting to send credentials email to ${to}...`);

        const info = await transporter.sendMail({
            from: `"Project Mayaa" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
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
