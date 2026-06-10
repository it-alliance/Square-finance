import { Router } from 'express';
import { 
  createMonthlyLoan, 
  getMonthlyLoans, 
  getMonthlyLoanById,
  exportMonthlyLoans,
  updateMonthlyLoan
} from '../controllers/monthlyLoan.controller';

const router = Router();

router.post('/', createMonthlyLoan);
router.get('/', getMonthlyLoans);
router.get('/:id', getMonthlyLoanById);
router.get('/export', exportMonthlyLoans);
router.put('/:id', updateMonthlyLoan);

export default router;
