import { Router } from 'express';
import { analyzeRFP, createRFP, getRFP, assignVendors, syncProposals, getRecommendation } from '../controllers/rfp.controller';

const router = Router();

router.post('/analyze', analyzeRFP);
router.post('/sync', syncProposals);
router.post('/:id/recommend', getRecommendation);
router.post('/', createRFP);
router.get('/:id', getRFP);
router.post('/:id/vendors', assignVendors);

export default router;
