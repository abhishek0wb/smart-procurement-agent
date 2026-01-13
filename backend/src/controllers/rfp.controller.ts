import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateStructuredRFP } from '../services/ai.service';
import { sendRFP } from '../services/email.service';
import { syncEmails } from '../services/inbound.service';
import { generateComparison } from '../services/ai.service';

const prisma = new PrismaClient();

export const analyzeRFP = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const structuredData = await generateStructuredRFP(text);
    res.json(structuredData);
  } catch (error) {
    console.error('Error analyzing RFP:', error);
    res.status(500).json({ error: 'Failed to analyze RFP' });
  }
};

export const createRFP = async (req: Request, res: Response) => {
  try {
    const { title, description, structuredData } = req.body;

    const rfp = await prisma.rFP.create({
      data: {
        title,
        description,
        structuredData: structuredData || {},
      },
    });

    res.status(201).json(rfp);
  } catch (error) {
    console.error('Error creating RFP:', error);
    res.status(500).json({ error: 'Failed to create RFP' });
  }
};

export const getRFP = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rfp = await prisma.rFP.findUnique({
      where: { id },
      include: {
        vendors: true,
        proposals: {
          include: { vendor: true }
        }
      },
    });
    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }
    res.json(rfp);
  } catch (error) {
    console.error('Error fetching RFP:', error);
    res.status(500).json({ error: 'Failed to fetch RFP' });
  }
};

export const assignVendors = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vendorIds } = req.body;

    if (!vendorIds || !Array.isArray(vendorIds)) {
      return res.status(400).json({ error: 'vendorIds must be an array' });
    }

    const rfp = await prisma.rFP.update({
      where: { id },
      data: {
        vendors: {
          connect: vendorIds.map((vId: string) => ({ id: vId })),
        },
        status: 'SENT', // Update status to sent
      },
      include: { vendors: true },
    });

    // Send emails
    await sendRFP(rfp, rfp.vendors);

    res.json(rfp);
  } catch (error) {
    console.error('Error assigning vendors:', error);
    res.status(500).json({ error: 'Failed to assign vendors' });
  }
};

export const syncProposals = async (req: Request, res: Response) => {
  try {
    const result = await syncEmails();
    res.json(result);
  } catch (error) {
    console.error('Error syncing proposals:', error);
    res.status(500).json({ error: 'Failed to sync proposals' });
  }
};



export const getRecommendation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rfp = await prisma.rFP.findUnique({
      where: { id },
      include: {
        proposals: {
          include: { vendor: true }
        }
      },
    });

    if (!rfp) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    if (!rfp.proposals || rfp.proposals.length === 0) {
      return res.status(400).json({ error: 'No proposals to compare' });
    }

    const recommendation = await generateComparison(rfp, rfp.proposals);
    res.json(recommendation);

  } catch (error) {
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
};
