import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { formatLoanResponse as formatMonthly } from './monthlyLoan.controller';
import { formatLoanResponse as formatWeekly } from './weeklyLoan.controller';
import { formatLoanResponse as formatDaily } from './dailyLoan.controller';
import { formatLoanResponse as formatInterest } from './interestLoan.controller';

export const addPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanId, loanType, amountPaid, paymentMode, date, splits } = req.body;

    // 1. Strict Input Validation
    if (!loanId || !loanType) {
      res.status(400).json({ status: "error", message: "loanId and loanType are required" });
      return;
    }

    const validLoanTypes = ['Monthly', 'Weekly', 'Daily', 'Interest'];
    if (!validLoanTypes.includes(loanType)) {
      res.status(400).json({ status: "error", message: "Invalid loanType. Must be Monthly, Weekly, Daily, or Interest" });
      return;
    }

    // Support single payment or array of split payments seamlessly
    let paymentSplits = [];
    if (splits && Array.isArray(splits) && splits.length > 0) {
      paymentSplits = splits;
    } else if (amountPaid !== undefined && paymentMode) {
      paymentSplits = [{ amountPaid, paymentMode }];
    }

    if (paymentSplits.length === 0) {
      res.status(400).json({ status: "error", message: "Please provide either a single payment (amountPaid, paymentMode) or an array of splits" });
      return;
    }

    // Bank-grade validation on ALL splits
    const validPaymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
    const validatedSplits = [];

    for (const split of paymentSplits) {
      const numericAmount = Number(split.amountPaid);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        res.status(400).json({ status: "error", message: "All payment split amounts must be strictly positive numbers" });
        return;
      }
      const mode = validPaymentModes.includes(split.paymentMode) ? split.paymentMode : 'Cash';
      validatedSplits.push({ amountPaid: numericAmount, paymentMode: mode });
    }

    await prisma.$transaction(async (tx) => {
      let activeLoan: any = null;

      // Ensure the loan exists AND is active before accepting payments
      if (loanType === 'Monthly') {
        activeLoan = await tx.monthlyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
      } else if (loanType === 'Weekly') {
        activeLoan = await tx.weeklyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
      } else if (loanType === 'Daily') {
        activeLoan = await tx.dailyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
      } else if (loanType === 'Interest') {
        activeLoan = await tx.interestLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
      }

      if (!activeLoan || activeLoan.isDeleted) {
        throw new Error("LOAN_NOT_FOUND");
      }

      if (activeLoan.status === 'Closed') {
        throw new Error("LOAN_CLOSED");
      }

      const paymentDate = date ? new Date(date) : new Date();

      // Create all payment records from splits in a single sweep
      const paymentsToCreate = validatedSplits.map(split => {
        const paymentData: any = {
          loanType,
          amountPaid: split.amountPaid,
          paymentMode: split.paymentMode,
          date: paymentDate,
        };

        if (loanType === 'Monthly') paymentData.monthlyLoanId = loanId;
        if (loanType === 'Weekly') paymentData.weeklyLoanId = loanId;
        if (loanType === 'Daily') paymentData.dailyLoanId = loanId;
        if (loanType === 'Interest') paymentData.interestLoanId = loanId;
        
        return paymentData;
      });

      await tx.payment.createMany({
        data: paymentsToCreate
      });
    });

    // Fetch the fully updated loan OUTSIDE the transaction to reduce database lock time and prevent bottlenecks
    let updatedLoan;
    if (loanType === 'Monthly') updatedLoan = await prisma.monthlyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
    else if (loanType === 'Weekly') updatedLoan = await prisma.weeklyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
    else if (loanType === 'Daily') updatedLoan = await prisma.dailyLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });
    else if (loanType === 'Interest') updatedLoan = await prisma.interestLoan.findUnique({ where: { id: loanId }, include: { customer: true, payments: true, followUps: true } });

    // 3. Exact JSON Formatting Match
    let formattedData;
    if (loanType === 'Monthly') formattedData = formatMonthly(updatedLoan);
    else if (loanType === 'Weekly') formattedData = formatWeekly(updatedLoan);
    else if (loanType === 'Daily') formattedData = formatDaily(updatedLoan);
    else if (loanType === 'Interest') formattedData = formatInterest(updatedLoan);

    res.status(201).json({
      status: "success",
      message: "Payments added successfully",
      data: formattedData
    });

  } catch (error: any) {
    console.error('Error processing payment:', error);
    
    if (error.message === 'LOAN_NOT_FOUND') {
      res.status(404).json({ status: "error", message: "Loan not found or is deleted" });
      return;
    }
    if (error.message === 'LOAN_CLOSED') {
      res.status(400).json({ status: "error", message: "Cannot add payment to a closed loan. Please reopen the loan first." });
      return;
    }

    res.status(500).json({ status: "error", message: "Failed to process payment due to internal server error" });
  }
};
