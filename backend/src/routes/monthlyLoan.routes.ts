import { Router } from 'express';
import { 
  createMonthlyLoan, 
  getMonthlyLoans, 
  exportMonthlyLoans,
  updateMonthlyLoan,
  deleteMonthlyLoan
} from '../controllers/monthlyLoan.controller';

import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

router.post('/', createMonthlyLoan);
router.get('/', getMonthlyLoans);
router.get('/export', exportMonthlyLoans);
router.put('/:id', updateMonthlyLoan);
router.delete('/:id', deleteMonthlyLoan);

export default router;
