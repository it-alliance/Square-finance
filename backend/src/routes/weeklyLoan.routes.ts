import { Router } from 'express';
import {
  createWeeklyLoan,
  updateWeeklyLoan,
  getWeeklyLoans,
  deleteWeeklyLoan,
  exportWeeklyLoans
} from '../controllers/weeklyLoan.controller';

const router = Router();

// Export must come before /:id routes to avoid "export" being treated as an id
router.get('/export', exportWeeklyLoans);

router.post('/', createWeeklyLoan);
router.get('/', getWeeklyLoans);
router.put('/:id', updateWeeklyLoan);
router.delete('/:id', deleteWeeklyLoan);

export default router;
