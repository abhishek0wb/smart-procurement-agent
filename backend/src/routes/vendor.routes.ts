import { Router } from 'express';
import { createVendor, getVendors } from '../controllers/vendor.controller';

const router = Router();

router.post('/', createVendor);
router.get('/', getVendors);

export default router;
