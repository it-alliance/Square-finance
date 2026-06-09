import { Router } from 'express';
import { 
  createMonthlyLoan, 
  getMonthlyLoans, 
  exportMonthlyLoans,
  updateMonthlyLoan
} from '../controllers/monthlyLoan.controller';

const router = Router();

router.post('/', createMonthlyLoan);
router.get('/', getMonthlyLoans);
router.get('/export', exportMonthlyLoans);
router.put('/:id', updateMonthlyLoan);

export default router;
