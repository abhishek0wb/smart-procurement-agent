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
        socketTimeout: 120000,
        greetingTimeout: 30000,
    });

    client.on('error', (err) => {
        console.error('IMAP client error:', err);
    });

    let syncedCount = 0;
    let lock = null;

    console.log('Starting email sync...');
    try {
        await client.connect();
        console.log('IMAP connected');

        lock = await client.getMailboxLock('INBOX');
        console.log('Mailbox locked, searching for emails...');

        // Collect all messages first (fast operation)
        const messagesToProcess = [];
        for await (const message of client.fetch({ subject: '[RFP-REF:' }, { source: true, envelope: true, uid: true })) {
            if (message.source) {
                messagesToProcess.push({
                    uid: message.uid,
                    source: message.source
                });
            }
        }

        console.log(`Found ${messagesToProcess.length} emails to process`);

        // Release lock and disconnect BEFORE processing
        lock.release();
        lock = null;
        await client.logout();
        console.log('IMAP connection closed, processing emails offline...');

        // Now process messages without holding IMAP connection
        for (const message of messagesToProcess) {
            try {
                const parsed = await simpleParser(message.source as any);
                const subject = parsed.subject || '';
                const body = parsed.text || '';
                const fromEmail = parsed.from?.value[0]?.address;

                // Check for [RFP-REF: ID]
                const match = subject.match(/\[RFP-REF:\s*([a-zA-Z0-9]+)\]/);

                if (match && fromEmail) {
                    const rfpId = match[1];

                    console.log(`Checking email: "${subject}" from ${fromEmail}`);

                    // Find vendor by email
                    const vendor = await prisma.vendor.findUnique({
                        where: { email: fromEmail }
                    });

                    // Check if RFP exists to avoid Foreign Key errors
                    const rfpExists = await prisma.rFP.findUnique({
                        where: { id: rfpId }
                    });

                    if (vendor && rfpExists) {
                        // Check for duplicate proposal
                        const existingProposal = await prisma.proposal.findFirst({
                            where: {
                                rfpId,
                                vendorId: vendor.id
                            }
                        });

                        if (existingProposal) {
                            console.log(`Skipping duplicate proposal from ${vendor.name} for RFP ${rfpId}`);
                        } else {
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
                            syncedCount++;
                            console.log(`✓ Created proposal from ${vendor.name}`);
                        }
                    } else {
                        console.warn(`Skipping email: Vendor (${fromEmail}) or RFP (${rfpId}) not found.`);
                    }
                }
            } catch (emailError) {
                console.error('Error processing individual email:', emailError);
                // Continue with next email instead of failing entire sync
            }
        }

        // Reconnect to mark emails as read
        if (messagesToProcess.length > 0) {
            try {
                console.log('Reconnecting to mark emails as read...');

                // Create a new client instance (can't reuse after logout)
                const markClient = new ImapFlow({
                    host: 'imap.gmail.com',
                    port: 993,
                    secure: true,
                    auth: {
                        user: process.env.GMAIL_USER,
                        pass: process.env.GMAIL_APP_PASSWORD,
                    },
                    logger: false,
                    socketTimeout: 30000,
                });

                markClient.on('error', (err) => {
                    console.error('IMAP mark client error:', err);
                });

                await markClient.connect();
                const markLock = await markClient.getMailboxLock('INBOX');

                for (const message of messagesToProcess) {
                    try {
                        await markClient.messageFlagsAdd({ uid: message.uid }, ['\\Seen']);
                    } catch (flagError) {
                        console.error('Error marking email as read:', flagError);
                    }
                }

                markLock.release();
                await markClient.logout();
                console.log('Emails marked as read successfully');
            } catch (reconnectError) {
                console.error('Error reconnecting to mark emails as read:', reconnectError);
                // Non-critical error, continue
            }
        }

        return { message: 'Sync complete', count: syncedCount };

    } catch (error) {
        console.error('Error syncing emails:', error);
        return { message: 'Sync failed', error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
        // Cleanup
        if (lock) {
            try {
                lock.release();
            } catch (e) {
                console.error('Error releasing lock:', e);
            }
        }
        try {
            await client.logout();
        } catch (e) {
            // Already logged out or connection closed
        }
    }
};
