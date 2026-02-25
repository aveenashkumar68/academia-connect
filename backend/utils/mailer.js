import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using ethereal for testing or real SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendCredentialsEmail = async (to, role, email, password) => {
    try {
        const info = await transporter.sendMail({
            from: `"Academia Connect" <${process.env.FROM_EMAIL || 'no-reply@example.com'}>`,
            to,
            subject: `Your ${role} Account Credentials`,
            text: `Hello,\n\nCongratulations you are a member of project mayaa and your user id and password is this:\nEmail: ${email}\nPassword: ${password}\n\nPlease login to access your account.\n\nThanks,\nAcademia Connect Team`,
            html: `
        <h3>Welcome to Academia Connect!</h3>
        <p>Congratulations you are a member of project mayaa and your user id and password is this:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
      `,
        });

        console.log('Message sent: %s', info.messageId);
        // If using ethereal email, you can view it by going to ethereal.email
        if (info.messageId && process.env.SMTP_HOST.includes('ethereal')) {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};
