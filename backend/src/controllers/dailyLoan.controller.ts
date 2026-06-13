import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper to format loan response universally into the nested structure
const formatLoanResponse = (loan: any) => ({
  id: loan.id,
  customerDetails: {
    customerName: loan.customer?.name || '',
    address: loan.customer?.currentAddress || '',
    ownRent: loan.customer?.ownRent || 'Own',
    mobileNumbers: loan.customer?.mobileNumbers || [],
    panNumber: loan.customer?.panNumber || '',
    aadharNumber: loan.customer?.aadharNumber || '',
    guarantorName: loan.customer?.guarantorName || '',
    guarantorMobileNumbers: loan.customer?.guarantorMobileNumbers || []
  },
  loanTerms: {
    loanNumber: loan.loanNumber,
    principalAmount: loan.totalPrincipalAmount,
    processingFeeRate: loan.processingFeeRate,
    processingFee: loan.processingFee,
    tenureMonths: loan.tenure, // Note: tenure is days, but keeping key same as MonthlyLoan/WeeklyLoan
    tenureType: "Daily",
    annualInterestRate: loan.interestRate,
    dateLoanDisbursed: loan.dateLoanDisbursed,
    emiStartDate: loan.emiStartDate,
    emiEndDate: loan.emiEndDate,
    monthlyEMI: loan.dailyEMI, // keeping the key identical to MonthlyLoan/WeeklyLoan
    totalInterestAmount: loan.totalInterestAmount,
    paymentMode: "Cash",
    chequeNumber: "",
    disbursement: []
  },
    status: {
    status: loan.status,
    paymentStatus: "Pending",
    isSeized: false,
    docChecklist: "",
    remarks: "",
    createdBy: null,
    updatedBy: null,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    clientResponse: "",
    nextFollowUpDate: loan.nextFollowupDate || '',
    seizedStatus: "",
    seizedDate: "",
    soldDetails: null,
    foreclosureDetails: {
      foreclosedBy: "",
      foreclosureDate: "",
      foreclosureAmount: 0
    }
  }
});

// Helper to calculate daily EMI based on a 365-day year
const calculateEMI = (principal: number, annualInterestRate: number, tenureDays: number): number => {
  if (!principal || !annualInterestRate || !tenureDays) return 0;
  // Convert annual rate to daily rate
  const dailyRate = annualInterestRate / 100 / 365;
  const emi = (principal * dailyRate * Math.pow(1 + dailyRate, tenureDays)) /
              (Math.pow(1 + dailyRate, tenureDays) - 1);
  return Number(emi.toFixed(2));
};

export const createDailyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerDetails, loanTerms, status } = req.body;

    if (!loanTerms?.loanNumber) {
      res.status(400).json({ status: "fail", message: "Loan number is required" });
      return;
    }

    const existingLoan = await prisma.dailyLoan.findUnique({
      where: { loanNumber: loanTerms.loanNumber }
    });

    if (existingLoan) {
      res.status(400).json({ 
        status: "fail", 
        message: `Loan number ${loanTerms.loanNumber} already exists. Please choose a different one.` 
      });
      return;
    }

    // Recalculate EMI strictly on the backend
    const emi = calculateEMI(
      Number(loanTerms.principalAmount), 
      Number(loanTerms.annualInterestRate), 
      Number(loanTerms.tenureMonths) // Note: tenureMonths payload key represents days here
    );
    const totalInterest = (emi * Number(loanTerms.tenureMonths)) - Number(loanTerms.principalAmount);
    
    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: customerDetails.customerName,
        currentAddress: customerDetails.address,
        ownRent: customerDetails.ownRent,
        panNumber: customerDetails.panNumber || null,
        aadharNumber: customerDetails.aadharNumber || null,
        primaryMobile: customerDetails.mobileNumbers?.[0] || "",
        mobileNumbers: customerDetails.mobileNumbers || [],
        guarantorName: customerDetails.guarantorName || null,
        primaryGuarantorMobile: customerDetails.guarantorMobileNumbers?.[0] || null,
        guarantorMobileNumbers: customerDetails.guarantorMobileNumbers || [],
      },
    });

    const initialPayments = loanTerms.disbursement ? loanTerms.disbursement.map((p: any) => ({
      loanType: 'Daily',
      amountPaid: Number(p.amount) || 0,
      date: new Date(p.date || new Date()),
      paymentMode: p.mode || loanTerms.paymentMode || 'Cash'
    })) : [];

    const loan = await prisma.dailyLoan.create({
      data: {
        customerId: customer.id,
        loanNumber: loanTerms.loanNumber,
        status: status?.status || "Active",
                                                                                                        
        totalPrincipalAmount: Number(loanTerms.principalAmount),
        processingFeeRate: Number(loanTerms.processingFeeRate),
        processingFee: Number(loanTerms.processingFee || 0),
        tenure: Number(loanTerms.tenureMonths), // storing days
        interestRate: Number(loanTerms.annualInterestRate),
        dailyEMI: emi,
        dateLoanDisbursed: loanTerms?.dateLoanDisbursed ? new Date(loanTerms.dateLoanDisbursed) : new Date(),
        emiStartDate: loanTerms?.emiStartDate ? new Date(loanTerms.emiStartDate) : new Date(),
        emiEndDate: loanTerms?.emiEndDate ? new Date(loanTerms.emiEndDate) : new Date(),
        totalInterestAmount: totalInterest,
        
        nextFollowupDate: status?.nextFollowUpDate ? new Date(status.nextFollowUpDate) : null,

        payments: {
          create: initialPayments
        }
      },
      include: {
        customer: true,
        payments: true
      }
    });

    if (status?.clientResponse && status?.nextFollowUpDate) {
      await prisma.followUp.create({
        data: {
          loanType: 'Daily',
          dailyLoanId: loan.id,
          promisedDate: new Date(status.nextFollowUpDate),
          employeeComment: status.clientResponse
        }
      });
    }

    res.status(201).json({ status: "success", message: "Daily loan created successfully", data: formatLoanResponse(loan) });
  } catch (error: any) {
    console.error('Error creating daily loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to create loan', data: error.message });
  }
};

export const updateDailyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerDetails, loanTerms, status } = req.body;

    const existingLoan = await prisma.dailyLoan.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!existingLoan || existingLoan.isDeleted) {
      res.status(404).json({ status: "fail", message: 'Loan not found' });
      return;
    }

    // Force recalculation if terms changed
    const principal = loanTerms?.principalAmount !== undefined ? Number(loanTerms.principalAmount) : existingLoan.totalPrincipalAmount;
    const interestRate = loanTerms?.annualInterestRate !== undefined ? Number(loanTerms.annualInterestRate) : existingLoan.interestRate;
    const tenure = loanTerms?.tenureMonths !== undefined ? Number(loanTerms.tenureMonths) : existingLoan.tenure;
    
    const emi = calculateEMI(principal, interestRate, tenure);
    const totalInterest = (emi * tenure) - principal;

    if (customerDetails) {
      await prisma.customer.update({
        where: { id: existingLoan.customerId },
        data: {
          name: customerDetails.customerName ?? existingLoan.customer.name,
          currentAddress: customerDetails.address ?? existingLoan.customer.currentAddress,
          ownRent: customerDetails.ownRent ?? existingLoan.customer.ownRent,
          panNumber: customerDetails.panNumber ?? existingLoan.customer.panNumber,
          aadharNumber: customerDetails.aadharNumber ?? existingLoan.customer.aadharNumber,
          primaryMobile: customerDetails.mobileNumbers?.[0] ?? existingLoan.customer.primaryMobile,
          mobileNumbers: customerDetails.mobileNumbers ?? existingLoan.customer.mobileNumbers,
          guarantorName: customerDetails.guarantorName ?? existingLoan.customer.guarantorName,
          primaryGuarantorMobile: customerDetails.guarantorMobileNumbers?.[0] ?? existingLoan.customer.primaryGuarantorMobile,
          guarantorMobileNumbers: customerDetails.guarantorMobileNumbers ?? existingLoan.customer.guarantorMobileNumbers,
        }
      });
    }

    const updatedLoan = await prisma.dailyLoan.update({
      where: { id },
      data: {
        status: status?.status ?? existingLoan.status,
                                                                                                        
        totalPrincipalAmount: principal,
        processingFeeRate: loanTerms?.processingFeeRate ? Number(loanTerms.processingFeeRate) : existingLoan.processingFeeRate,
        processingFee: loanTerms?.processingFee ? Number(loanTerms.processingFee) : existingLoan.processingFee,
        tenure: tenure,
        interestRate: interestRate,
        dailyEMI: emi,
        dateLoanDisbursed: loanTerms?.dateLoanDisbursed ? new Date(loanTerms.dateLoanDisbursed) : existingLoan.dateLoanDisbursed,
        emiStartDate: loanTerms?.emiStartDate ? new Date(loanTerms.emiStartDate) : existingLoan.emiStartDate,
        emiEndDate: loanTerms?.emiEndDate ? new Date(loanTerms.emiEndDate) : existingLoan.emiEndDate,
        totalInterestAmount: totalInterest,
        
        nextFollowupDate: status?.nextFollowUpDate ? new Date(status.nextFollowUpDate) : existingLoan.nextFollowupDate,
      },
      include: { customer: true }
    });

    if (status?.clientResponse && status?.nextFollowUpDate) {
      await prisma.followUp.create({
        data: {
          loanType: 'Daily',
          dailyLoanId: updatedLoan.id,
          promisedDate: new Date(status.nextFollowUpDate),
          employeeComment: status.clientResponse
        }
      });
    }

    res.status(200).json({ status: "success", message: "Daily loan updated successfully", data: formatLoanResponse(updatedLoan) });
  } catch (error: any) {
    console.error('Error updating daily loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to update loan', data: error.message });
  }
};

export const getDailyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '10',
      loanNumber,
      customerName,
      mobileNumber,
            tenure,
      status
    } = req.query;

    const take = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const skip = (pageNum - 1) * take;

    const where: any = { isDeleted: false };
    
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
        if (tenure) where.tenure = parseInt(tenure as string, 10);
    
    if (customerName || mobileNumber) {
      where.customer = {};
      if (customerName) where.customer.name = { startsWith: customerName as string, mode: 'insensitive' };
      if (mobileNumber) where.customer.primaryMobile = { startsWith: mobileNumber as string };
    }

    const queryOptions: any = {
      take,
      skip,
      where,
      include: { customer: true },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ]
    };

    const [loans, totalItems] = await Promise.all([
      prisma.dailyLoan.findMany(queryOptions),
      prisma.dailyLoan.count({ where })
    ]);

    const totalPages = Math.ceil(totalItems / take);
    const formattedLoans = loans.map(formatLoanResponse);

    res.status(200).json({
      status: "success",
      message: "Daily loans fetched successfully",
      data: {
        data: formattedLoans,
        items: totalItems,
        limit: take,
        "current page": pageNum,
        "total number of pages": totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching daily loans:', error);
    res.status(500).json({ status: "error", message: 'Failed to fetch loans' });
  }
};

export const deleteDailyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingLoan = await prisma.dailyLoan.findUnique({
      where: { id }
    });

    if (!existingLoan || existingLoan.isDeleted) {
      res.status(404).json({ status: "fail", message: 'Loan not found' });
      return;
    }

    await prisma.dailyLoan.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.status(200).json({ status: "success", message: "Loan deleted successfully" });
  } catch (error: any) {
    console.error('Error deleting daily loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to delete loan', data: error.message });
  }
};

export const exportDailyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      loanNumber,
      customerName,
      mobileNumber,
            tenure,
      status,
      startDate,
      endDate
    } = req.query;

    const where: any = { isDeleted: false };
    
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
        if (tenure) where.tenure = parseInt(tenure as string, 10);
    
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
    res.setHeader('Content-Disposition', 'attachment; filename=daily_loans.csv');

    const headers = ['Loan Number', 'Customer Name', 'Mobile', 'Status', 'Principal', 'EMI', 'Tenure', 'Created At'];
    res.write(headers.join(',') + '\n');

    let cursor: string | undefined = undefined;
    const CHUNK_SIZE = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const options: any = {
        take: CHUNK_SIZE,
        skip: cursor ? 1 : 0,
        where,
        include: { customer: true },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ]
      };

      if (cursor) {
        options.cursor = { id: cursor };
      }

      const loansChunk = await prisma.dailyLoan.findMany(options);

      if (loansChunk.length === 0) {
        keepFetching = false;
        break;
      }

      for (const loan of loansChunk) {
        const row = [
          `"${loan.loanNumber}"`,
          `"${loan.customer?.name || ''}"`,
          `"${loan.customer?.primaryMobile || ''}"`,
                    `"${loan.status}"`,
          loan.totalPrincipalAmount,
          loan.dailyEMI,
          loan.tenure,
          `"${loan.createdAt.toISOString()}"`
        ];
        res.write(row.join(',') + '\n');
      }

      cursor = loansChunk[loansChunk.length - 1].id;
      if (loansChunk.length < CHUNK_SIZE) {
        keepFetching = false;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error exporting daily loans:', error);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: 'Failed to export loans' });
    } else {
      res.end();
    }
  }
};
