import { Router } from 'express';
import { addPayment } from '../controllers/payment.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.post('/', addPayment);

export default router;
