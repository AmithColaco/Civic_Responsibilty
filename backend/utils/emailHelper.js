const nodemailer = require('nodemailer');

const sendMail = async ({ to, subject, text, html }) => {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || '"CivicSense Notifications" <noreply@civicsense.mangaluru.gov.in>';

    // Fallback if credentials are not configured in .env
    if (!smtpUser || !smtpPass) {
        console.log(`
========================================================================
[EMAIL SIMULATION] Live credentials not set in .env. Logged to console:
------------------------------------------------------------------------
To: ${to}
From: ${smtpFrom}
Subject: ${subject}

${text}
========================================================================
        `);
        return { success: true, simulated: true };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const info = await transporter.sendMail({
            from: smtpFrom,
            to: to,
            subject: subject,
            text: text,
            html: html || text.replace(/\n/g, '<br>')
        });

        console.log(`✉️ Live Email successfully dispatched to ${to}! MessageId: ${info.messageId}`);
        return { success: true, simulated: false, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ Failed to send live email to ${to}:`, err.message);
        console.log(`
========================================================================
[EMAIL SIMULATION] SMTP Dispatch Failed. Fallback printed to console:
------------------------------------------------------------------------
To: ${to}
From: ${smtpFrom}
Subject: ${subject}

${text}
========================================================================
        `);
        return { success: false, simulated: true, error: err.message };
    }
};

module.exports = { sendMail };
