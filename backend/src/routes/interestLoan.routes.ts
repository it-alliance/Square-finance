import { Router } from 'express';
import { 
  createInterestLoan, 
  getInterestLoans, 
  updateInterestLoan, 
  deleteInterestLoan 
} from '../controllers/interestLoan.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Protect all routes with auth middleware
router.use(authMiddleware);

// Routes
router.post('/', createInterestLoan);
router.get('/', getInterestLoans);
router.put('/:id', updateInterestLoan);
router.delete('/:id', deleteInterestLoan);

export default router;
