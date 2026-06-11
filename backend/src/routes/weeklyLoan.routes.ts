import { Router } from 'express';
import {
  createWeeklyLoan,
  updateWeeklyLoan,
  getWeeklyLoans,
  deleteWeeklyLoan,
  exportWeeklyLoans
} from '../controllers/weeklyLoan.controller';

import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// Export must come before /:id routes to avoid "export" being treated as an id
router.get('/export', exportWeeklyLoans);

router.post('/', createWeeklyLoan);
router.get('/', getWeeklyLoans);
router.put('/:id', updateWeeklyLoan);
router.delete('/:id', deleteWeeklyLoan);

export default router;
