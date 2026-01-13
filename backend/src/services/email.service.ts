import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendRFP = async (rfp: any, vendors: any[]) => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials not found. Email sending skipped.');
        return;
    }

    for (const vendor of vendors) {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: vendor.email,
            subject: `New Request for Proposal: ${rfp.title} [RFP-REF: ${rfp.id}]`,
            text: `Dear ${vendor.name},

You are invited to submit a proposal for the following RFP:

Title: ${rfp.title}
Description: ${rfp.description}

Please reply to this email with your quote, timeline, and any special terms.
CRITICAL: Do not change the subject line when replying.

Best regards,
RFP Team`,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${vendor.email}`);
        } catch (error) {
            console.error(`Failed to send email to ${vendor.email}:`, error);
        }
    }
};
