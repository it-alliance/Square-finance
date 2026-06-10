import { Router } from 'express';
import {
  createDailyLoan,
  updateDailyLoan,
  getDailyLoans,
  deleteDailyLoan,
  exportDailyLoans
} from '../controllers/dailyLoan.controller';

const router = Router();

router.post('/', createDailyLoan);
router.get('/', getDailyLoans);
router.get('/export', exportDailyLoans);
router.put('/:id', updateDailyLoan);
router.delete('/:id', deleteDailyLoan);

export default router;
