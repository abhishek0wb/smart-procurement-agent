import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';
import { extractProposalDetails } from './ai.service';
import { env } from '../config/env';

const prisma = new PrismaClient();

export const syncEmails = async () => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials missing. Skipping email sync.');
        return { message: 'Skipped - credentials missing' };
    }

    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
        logger: false,
    });

    let syncedCount = 0;

    try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');

        try {
            // Search for unseen emails
            for await (const message of client.fetch({ seen: false }, { source: true, envelope: true })) {
                if (!message.source) continue;
                const parsed = await simpleParser(message.source);
                const subject = parsed.subject || '';
                const body = parsed.text || '';
                const fromEmail = parsed.from?.value[0]?.address;

                // Check for [RFP-REF: ID]
                const match = subject.match(/\[RFP-REF:\s*([a-zA-Z0-9]+)\]/);

                if (match && fromEmail) {
                    const rfpId = match[1];

                    // Find vendor by email
                    const vendor = await prisma.vendor.findUnique({
                        where: { email: fromEmail }
                    });

                    if (vendor) {
                        console.log(`Processing proposal from ${vendor.name} for RFP ${rfpId}`);

                        // Extract details with AI
                        const details = await extractProposalDetails(body);

                        // Create Proposal
                        await prisma.proposal.create({
                            data: {
                                rfpId,
                                vendorId: vendor.id,
                                rawText: body,
                                price: details.price?.toString(),
                                timeline: details.timeline?.toString(),
                                terms: details.terms?.toString(),
                            },
                        });

                        // Mark as read
                        await client.messageFlagsAdd({ uid: message.uid }, ['\\Seen']);
                        syncedCount++;
                    }
                }
            }
        } finally {
            lock.release();
        }

        await client.logout();
        return { message: 'Sync complete', count: syncedCount };

    } catch (error) {
        console.error('Error syncing emails:', error);
        throw new Error('Email sync failed');
    }
};
