import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

import monthlyLoanRoutes from './routes/monthlyLoan.routes';

app.use('/api/auth', authRoutes);
app.use('/api/monthly-loans', monthlyLoanRoutes);

app.use(errorHandler);

export default app;
