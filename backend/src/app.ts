import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

import monthlyLoanRoutes from './routes/monthlyLoan.routes';
import weeklyLoanRoutes from './routes/weeklyLoan.routes';
import dailyLoanRoutes from './routes/dailyLoan.routes';

app.use('/api/auth', authRoutes);
app.use('/api/monthly-loans', monthlyLoanRoutes);
app.use('/api/weekly-loans', weeklyLoanRoutes);
app.use('/api/daily-loans', dailyLoanRoutes);

app.use(errorHandler);

export default app;
