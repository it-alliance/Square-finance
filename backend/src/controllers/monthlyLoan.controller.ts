import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper to calculate EMI
const calculateEMI = (principal: number, annualInterestRate: number, tenureMonths: number): number => {
  if (!principal || !annualInterestRate || !tenureMonths) return 0;
  const monthlyRate = annualInterestRate / 100 / 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Number(emi.toFixed(2));
};

export const createMonthlyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    // Recalculate EMI strictly on the backend to avoid frontend manipulation
    const emi = calculateEMI(
      Number(data.totalPrincipalAmount), 
      Number(data.interestRate), 
      Number(data.tenure)
    );
    const totalInterest = (emi * Number(data.tenure)) - Number(data.totalPrincipalAmount);
    
    // First create or find customer
    const customer = await prisma.customer.create({
      data: {
        name: data.customerName,
        currentAddress: data.currentAddress,
        ownRent: data.ownRent,
        panNumber: data.panNumber || null,
        aadharNumber: data.aadharNumber || null,
        primaryMobile: data.primaryMobileNumber,
        mobileNumbers: data.mobileNumbers || [],
        guarantorName: data.guarantorName || null,
        primaryGuarantorMobile: data.primaryGuarantorMobile || null,
        guarantorMobileNumbers: data.guarantorMobileNumbers || [],
      },
    });

    const initialPayments = data.payments ? data.payments.map((p: any) => ({
      loanType: 'Monthly',
      amountPaid: Number(p.amount) || 0,
      date: new Date(p.date || new Date()),
      paymentMode: p.mode || 'Cash'
    })) : [];

    const loan = await prisma.monthlyLoan.create({
      data: {
        customerId: customer.id,
        loanNumber: data.loanNumber,
        status: data.status,
        vehicleNumber: data.vehicleNumber,
        chassisNumber: data.chassisNumber,
        engineNumber: data.engineNumber,
        modelYear: Number(data.modelYear),
        typeOfVehicle: data.typeOfVehicle,
        boardType: data.boardType,
        dealerName: data.dealerName || null,
        dealerNumber: data.dealerNumber || null,
        fcDate: data.fcDate ? new Date(data.fcDate) : null,
        insuranceDate: data.insuranceDate ? new Date(data.insuranceDate) : null,
        hpEntry: data.hpEntry,
        rtoPending: data.rtoPending || [],
        
        totalPrincipalAmount: Number(data.totalPrincipalAmount),
        processingFeeRate: Number(data.processingFeeRate),
        processingFee: Number(data.processingFee || 0),
        tenure: Number(data.tenure),
        interestRate: Number(data.interestRate),
        monthlyEMI: emi,
        dateLoanDisbursed: new Date(data.dateLoanDisbursed),
        emiStartDate: new Date(data.emiStartDate),
        emiEndDate: new Date(data.emiEndDate),
        totalInterestAmount: totalInterest,
        
        nextFollowupDate: data.status?.nextFollowUpDate ? new Date(data.status.nextFollowUpDate) : null,

        payments: {
          create: initialPayments
        }
      },
      include: {
        customer: true,
        payments: true
      }
    });

    if (data.status?.clientResponse && data.status?.nextFollowUpDate) {
      await prisma.followUp.create({
        data: {
          loanType: 'Monthly',
          loanId: loan.id,
          monthlyLoanId: loan.id,
          promisedDate: new Date(data.status.nextFollowUpDate),
          employeeComment: data.status.clientResponse
        }
      });
    }

    res.status(201).json({ success: true, data: loan });
  } catch (error: any) {
    console.error('Error creating monthly loan:', error);
    res.status(500).json({ success: false, message: 'Failed to create loan', error: error.message });
  }
};

export const updateMonthlyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingLoan = await prisma.monthlyLoan.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!existingLoan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    // Force recalculation if terms changed
    const principal = data.totalPrincipalAmount !== undefined ? Number(data.totalPrincipalAmount) : existingLoan.totalPrincipalAmount;
    const interestRate = data.interestRate !== undefined ? Number(data.interestRate) : existingLoan.interestRate;
    const tenure = data.tenure !== undefined ? Number(data.tenure) : existingLoan.tenure;
    
    const emi = calculateEMI(principal, interestRate, tenure);
    const totalInterest = (emi * tenure) - principal;

    // Update Customer details
    await prisma.customer.update({
      where: { id: existingLoan.customerId },
      data: {
        name: data.customerName ?? existingLoan.customer.name,
        currentAddress: data.currentAddress ?? existingLoan.customer.currentAddress,
        ownRent: data.ownRent ?? existingLoan.customer.ownRent,
        panNumber: data.panNumber ?? existingLoan.customer.panNumber,
        aadharNumber: data.aadharNumber ?? existingLoan.customer.aadharNumber,
        primaryMobile: data.primaryMobileNumber ?? existingLoan.customer.primaryMobile,
        mobileNumbers: data.mobileNumbers ?? existingLoan.customer.mobileNumbers,
        guarantorName: data.guarantorName ?? existingLoan.customer.guarantorName,
        primaryGuarantorMobile: data.primaryGuarantorMobile ?? existingLoan.customer.primaryGuarantorMobile,
        guarantorMobileNumbers: data.guarantorMobileNumbers ?? existingLoan.customer.guarantorMobileNumbers,
      }
    });

    const updatedLoan = await prisma.monthlyLoan.update({
      where: { id },
      data: {
        status: data.status ?? existingLoan.status,
        vehicleNumber: data.vehicleNumber ?? existingLoan.vehicleNumber,
        chassisNumber: data.chassisNumber ?? existingLoan.chassisNumber,
        engineNumber: data.engineNumber ?? existingLoan.engineNumber,
        modelYear: data.modelYear ? Number(data.modelYear) : existingLoan.modelYear,
        typeOfVehicle: data.typeOfVehicle ?? existingLoan.typeOfVehicle,
        boardType: data.boardType ?? existingLoan.boardType,
        dealerName: data.dealerName ?? existingLoan.dealerName,
        dealerNumber: data.dealerNumber ?? existingLoan.dealerNumber,
        fcDate: data.fcDate ? new Date(data.fcDate) : existingLoan.fcDate,
        insuranceDate: data.insuranceDate ? new Date(data.insuranceDate) : existingLoan.insuranceDate,
        hpEntry: data.hpEntry ?? existingLoan.hpEntry,
        rtoPending: data.rtoPending ?? existingLoan.rtoPending,
        
        totalPrincipalAmount: principal,
        processingFeeRate: data.processingFeeRate ? Number(data.processingFeeRate) : existingLoan.processingFeeRate,
        processingFee: data.processingFee ? Number(data.processingFee) : existingLoan.processingFee,
        tenure: tenure,
        interestRate: interestRate,
        monthlyEMI: emi,
        dateLoanDisbursed: data.dateLoanDisbursed ? new Date(data.dateLoanDisbursed) : existingLoan.dateLoanDisbursed,
        emiStartDate: data.emiStartDate ? new Date(data.emiStartDate) : existingLoan.emiStartDate,
        emiEndDate: data.emiEndDate ? new Date(data.emiEndDate) : existingLoan.emiEndDate,
        totalInterestAmount: totalInterest,
        
        nextFollowupDate: data.status?.nextFollowUpDate ? new Date(data.status.nextFollowUpDate) : existingLoan.nextFollowupDate,
      },
      include: { customer: true }
    });

    if (data.status?.clientResponse && data.status?.nextFollowUpDate) {
      await prisma.followUp.create({
        data: {
          loanType: 'Monthly',
          loanId: updatedLoan.id,
          monthlyLoanId: updatedLoan.id,
          promisedDate: new Date(data.status.nextFollowUpDate),
          employeeComment: data.status.clientResponse
        }
      });
    }

    res.status(200).json({ success: true, data: updatedLoan });
  } catch (error: any) {
    console.error('Error updating monthly loan:', error);
    res.status(500).json({ success: false, message: 'Failed to update loan', error: error.message });
  }
};

export const getMonthlyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      cursor, 
      limit = '10',
      loanNumber,
      customerName,
      mobileNumber,
      vehicleNumber,
      tenure,
      status
    } = req.query;

    const take = parseInt(limit as string, 10);
    
    // Build Prisma where clause using scalable `startsWith` for index hits
    const where: any = {};
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    if (vehicleNumber) where.vehicleNumber = { startsWith: vehicleNumber as string, mode: 'insensitive' };
    if (tenure) where.tenure = parseInt(tenure as string, 10);
    
    if (customerName || mobileNumber) {
      where.customer = {};
      if (customerName) where.customer.name = { startsWith: customerName as string, mode: 'insensitive' };
      if (mobileNumber) where.customer.primaryMobile = { startsWith: mobileNumber as string };
    }

    const queryOptions: any = {
      take: take + 1, // Fetch one extra to determine if there's a next page
      where,
      include: {
        customer: true
      },
      orderBy: { createdAt: 'desc' }
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor as string };
    }

    const loans = await prisma.monthlyLoan.findMany(queryOptions);

    let nextCursor: string | null = null;
    if (loans.length > take) {
      const nextItem = loans.pop(); // Remove the extra item
      nextCursor = nextItem!.id;
    }

    res.status(200).json({
      success: true,
      data: loans,
      nextCursor
    });

  } catch (error: any) {
    console.error('Error fetching monthly loans:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loans' });
  }
};

export const exportMonthlyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      loanNumber,
      customerName,
      mobileNumber,
      vehicleNumber,
      tenure,
      status,
      startDate,
      endDate
    } = req.query;

    // Filters with scalable `startsWith`
    const where: any = {};
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    if (vehicleNumber) where.vehicleNumber = { startsWith: vehicleNumber as string, mode: 'insensitive' };
    if (tenure) where.tenure = parseInt(tenure as string, 10);
    
    // Add Date range support
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    if (customerName || mobileNumber) {
      where.customer = {};
      if (customerName) where.customer.name = { startsWith: customerName as string, mode: 'insensitive' };
      if (mobileNumber) where.customer.primaryMobile = { startsWith: mobileNumber as string };
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=monthly_loans.csv');

    // Write header
    const headers = ['Loan Number', 'Customer Name', 'Mobile', 'Vehicle Number', 'Status', 'Principal', 'EMI', 'Tenure', 'Created At'];
    res.write(headers.join(',') + '\n');

    // Streaming Logic: Fetching chunks to prevent OOM
    let cursor: string | undefined = undefined;
    const CHUNK_SIZE = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const options: any = {
        take: CHUNK_SIZE,
        skip: cursor ? 1 : 0,
        where,
        include: { customer: true },
        orderBy: { createdAt: 'desc' }
      };

      if (cursor) {
        options.cursor = { id: cursor };
      }

      const loansChunk = await prisma.monthlyLoan.findMany(options);

      if (loansChunk.length === 0) {
        keepFetching = false;
        break;
      }

      for (const loan of loansChunk) {
        const row = [
          `"${loan.loanNumber}"`,
          `"${loan.customer?.name || ''}"`,
          `"${loan.customer?.primaryMobile || ''}"`,
          `"${loan.vehicleNumber}"`,
          `"${loan.status}"`,
          loan.totalPrincipalAmount,
          loan.monthlyEMI,
          loan.tenure,
          `"${loan.createdAt.toISOString()}"`
        ];
        res.write(row.join(',') + '\n');
      }

      cursor = loansChunk[loansChunk.length - 1].id;
      
      // If we got exactly the chunk size, there might be more
      if (loansChunk.length < CHUNK_SIZE) {
        keepFetching = false;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error exporting loans:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to export loans' });
    } else {
      res.end();
    }
  }
};
