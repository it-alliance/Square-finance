import { Router } from 'express';
import {
  createDailyLoan,
  updateDailyLoan,
  getDailyLoans,
  deleteDailyLoan,
  exportDailyLoans
} from '../controllers/dailyLoan.controller';

import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', createDailyLoan);
router.get('/', getDailyLoans);
router.get('/export', exportDailyLoans);
router.put('/:id', updateDailyLoan);
router.delete('/:id', deleteDailyLoan);

export default router;
