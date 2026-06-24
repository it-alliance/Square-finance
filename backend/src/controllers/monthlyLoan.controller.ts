import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper to format loan response universally into the nested structure
export const formatLoanResponse = (loan: any) => ({
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
    tenureMonths: loan.tenure,
    tenureType: "Monthly",
    annualInterestRate: loan.interestRate,
    dateLoanDisbursed: loan.dateLoanDisbursed,
    emiStartDate: loan.emiStartDate,
    emiEndDate: loan.emiEndDate,
    monthlyEMI: loan.monthlyEMI,
    totalInterestAmount: loan.totalInterestAmount,
    paymentMode: "Cash",
    chequeNumber: "",
    disbursement: []
  },
  vehicleInformation: {
    vehicleNumber: loan.vehicleNumber,
    chassisNumber: loan.chassisNumber,
    engineNumber: loan.engineNumber,
    modelYear: loan.modelYear,
    typeOfVehicle: loan.typeOfVehicle,
    ywBoard: loan.boardType,
    dealerName: loan.dealerName || '',
    dealerNumber: loan.dealerNumber || '',
    fcDate: loan.fcDate || '',
    insuranceDate: loan.insuranceDate || '',
    rtoWorkPending: loan.rtoPending || [],
    hpEntry: loan.hpEntry
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
  },
  payments: loan.payments || [],
  followUps: loan.followUps || []
});

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
    const { customerDetails, loanTerms, vehicleInformation, status } = req.body;

    if (!loanTerms?.loanNumber) {
      res.status(400).json({ status: "fail", message: "Loan number is required" });
      return;
    }

    // Check for Duplicate Loan Number
    const existingLoan = await prisma.monthlyLoan.findUnique({
      where: { loanNumber: loanTerms.loanNumber }
    });

    if (existingLoan) {
      res.status(400).json({ 
        status: "fail", 
        message: `Loan number ${loanTerms.loanNumber} already exists. Please choose a different one.` 
      });
      return;
    }

    // Recalculate EMI strictly on the backend to avoid frontend manipulation
    const emi = calculateEMI(
      Number(loanTerms.principalAmount), 
      Number(loanTerms.annualInterestRate), 
      Number(loanTerms.tenureMonths)
    );
    const totalInterest = (emi * Number(loanTerms.tenureMonths)) - Number(loanTerms.principalAmount);
    
    // First create customer
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
      loanType: 'Monthly',
      amountPaid: Number(p.amount) || 0,
      date: new Date(p.date || new Date()),
      paymentMode: p.mode || loanTerms.paymentMode || 'Cash'
    })) : [];

    const loan = await prisma.monthlyLoan.create({
      data: {
        customerId: customer.id,
        loanNumber: loanTerms.loanNumber,
        status: status?.status || "Active",
        vehicleNumber: vehicleInformation?.vehicleNumber || "",
        chassisNumber: vehicleInformation?.chassisNumber || "",
        engineNumber: vehicleInformation?.engineNumber || "",
        modelYear: vehicleInformation?.modelYear ? Number(vehicleInformation.modelYear) : new Date().getFullYear(),
        typeOfVehicle: vehicleInformation?.typeOfVehicle || "Unknown",
        boardType: vehicleInformation?.ywBoard || "Unknown",
        dealerName: vehicleInformation?.dealerName || null,
        dealerNumber: vehicleInformation?.dealerNumber || null,
        fcDate: vehicleInformation?.fcDate ? new Date(vehicleInformation.fcDate) : null,
        insuranceDate: vehicleInformation?.insuranceDate ? new Date(vehicleInformation.insuranceDate) : null,
        hpEntry: vehicleInformation?.hpEntry || "Not Done",
        rtoPending: vehicleInformation?.rtoWorkPending || [],
        
        totalPrincipalAmount: Number(loanTerms.principalAmount),
        processingFeeRate: Number(loanTerms.processingFeeRate),
        processingFee: Number(loanTerms.processingFee || 0),
        tenure: Number(loanTerms.tenureMonths),
        interestRate: Number(loanTerms.annualInterestRate),
        monthlyEMI: emi,
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
          loanType: 'Monthly',
          monthlyLoanId: loan.id,
          promisedDate: new Date(status.nextFollowUpDate),
          employeeComment: status.clientResponse
        }
      });
    }

    res.status(201).json({ 
      status: "success", 
      message: "Monthly loan created successfully",
      data: formatLoanResponse(loan) 
    });
  } catch (error: any) {
    console.error('Error creating monthly loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to create loan', data: error.message });
  }
};

export const updateMonthlyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { customerDetails, loanTerms, vehicleInformation, status } = req.body;

    const existingLoan = await prisma.monthlyLoan.findUnique({
      where: { id },
      include: { customer: true, payments: true, followUps: true }
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

    // Update Customer details if provided
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

    const updatedLoan = await prisma.monthlyLoan.update({
      where: { id },
      data: {
        status: status?.status ?? existingLoan.status,
        vehicleNumber: vehicleInformation?.vehicleNumber ?? existingLoan.vehicleNumber,
        chassisNumber: vehicleInformation?.chassisNumber ?? existingLoan.chassisNumber,
        engineNumber: vehicleInformation?.engineNumber ?? existingLoan.engineNumber,
        modelYear: vehicleInformation?.modelYear ? Number(vehicleInformation.modelYear) : existingLoan.modelYear,
        typeOfVehicle: vehicleInformation?.typeOfVehicle ?? existingLoan.typeOfVehicle,
        boardType: vehicleInformation?.ywBoard ?? existingLoan.boardType,
        dealerName: vehicleInformation?.dealerName ?? existingLoan.dealerName,
        dealerNumber: vehicleInformation?.dealerNumber ?? existingLoan.dealerNumber,
        fcDate: vehicleInformation?.fcDate ? new Date(vehicleInformation.fcDate) : existingLoan.fcDate,
        insuranceDate: vehicleInformation?.insuranceDate ? new Date(vehicleInformation.insuranceDate) : existingLoan.insuranceDate,
        hpEntry: vehicleInformation?.hpEntry ?? existingLoan.hpEntry,
        rtoPending: vehicleInformation?.rtoWorkPending ?? existingLoan.rtoPending,
        
        totalPrincipalAmount: principal,
        processingFeeRate: loanTerms?.processingFeeRate ? Number(loanTerms.processingFeeRate) : existingLoan.processingFeeRate,
        processingFee: loanTerms?.processingFee ? Number(loanTerms.processingFee) : existingLoan.processingFee,
        tenure: tenure,
        interestRate: interestRate,
        monthlyEMI: emi,
        dateLoanDisbursed: loanTerms?.dateLoanDisbursed ? new Date(loanTerms.dateLoanDisbursed) : existingLoan.dateLoanDisbursed,
        emiStartDate: loanTerms?.emiStartDate ? new Date(loanTerms.emiStartDate) : existingLoan.emiStartDate,
        emiEndDate: loanTerms?.emiEndDate ? new Date(loanTerms.emiEndDate) : existingLoan.emiEndDate,
        totalInterestAmount: totalInterest,
        
        nextFollowupDate: status?.nextFollowUpDate ? new Date(status.nextFollowUpDate) : existingLoan.nextFollowupDate,
      },
      include: { customer: true, payments: true, followUps: true }
    });

    if (status?.clientResponse && status?.nextFollowUpDate) {
      await prisma.followUp.create({
        data: {
          loanType: 'Monthly',
          monthlyLoanId: updatedLoan.id,
          promisedDate: new Date(status.nextFollowUpDate),
          employeeComment: status.clientResponse
        }
      });
    }

    res.status(200).json({ 
      status: "success", 
      message: "Monthly loan updated successfully",
      data: formatLoanResponse(updatedLoan) 
    });
  } catch (error: any) {
    console.error('Error updating monthly loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to update loan', data: error.message });
  }
};

export const getMonthlyLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '10',
      loanNumber,
      customerName,
      mobileNumber,
      vehicleNumber,
      tenure,
      status
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const take = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * take;
    
    // Base where clause to exclude deleted records
    const where: any = { isDeleted: false };
    
    // Build Prisma where clause using scalable `startsWith` for index hits
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    if (vehicleNumber) where.vehicleNumber = { startsWith: vehicleNumber as string, mode: 'insensitive' };
    if (tenure) where.tenure = parseInt(tenure as string, 10);
    
    if (customerName || mobileNumber) {
      where.customer = {};
      if (customerName) where.customer.name = { startsWith: customerName as string, mode: 'insensitive' };
      if (mobileNumber) where.customer.primaryMobile = { startsWith: mobileNumber as string };
    }

    const [totalItems, loans] = await Promise.all([
      prisma.monthlyLoan.count({ where }),
      prisma.monthlyLoan.findMany({
        skip,
        take,
        where,
        include: { customer: true, payments: true, followUps: true },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ]
      })
    ]);

    const formattedLoans = loans.map(formatLoanResponse);
    const totalPages = Math.ceil(totalItems / take);

    res.status(200).json({
      status: "success",
      message: "Monthly loans fetched successfully",
      data: {
        data: formattedLoans,
        items: totalItems,
        limit: take,
        "current page": pageNum,
        "total number of pages": totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching monthly loans:', error);
    res.status(500).json({ status: "error", message: 'Failed to fetch loans' });
  }
};

export const deleteMonthlyLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingLoan = await prisma.monthlyLoan.findUnique({
      where: { id }
    });

    if (!existingLoan || existingLoan.isDeleted) {
      res.status(404).json({ status: "fail", message: 'Loan not found' });
      return;
    }

    // Soft Delete Implementation
    await prisma.monthlyLoan.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.status(200).json({ status: "success", message: "Loan deleted successfully" });
  } catch (error: any) {
    console.error('Error deleting monthly loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to delete loan', data: error.message });
  }
};

export const getMonthlyLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const loan = await prisma.monthlyLoan.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: true,
        followUps: true
      }
    });

    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found' });
      return;
    }

    res.status(200).json({ success: true, data: loan });
  } catch (error: any) {
    console.error('Error fetching loan details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch loan details', error: error.message });
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

    const where: any = { isDeleted: false };
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    if (vehicleNumber) where.vehicleNumber = { startsWith: vehicleNumber as string, mode: 'insensitive' };
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
    res.setHeader('Content-Disposition', 'attachment; filename=monthly_loans.csv');

    const headers = ['Loan Number', 'Customer Name', 'Mobile', 'Vehicle Number', 'Status', 'Principal', 'EMI', 'Tenure', 'Created At'];
    res.write(headers.join(',') + '\n');

    let cursor: string | undefined = undefined;
    const CHUNK_SIZE = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const options: any = {
        take: CHUNK_SIZE,
        skip: cursor ? 1 : 0,
        where,
        include: { customer: true, payments: true, followUps: true },
        orderBy: [
          { createdAt: 'desc' },
          { id: 'desc' }
        ]
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
      if (loansChunk.length < CHUNK_SIZE) {
        keepFetching = false;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error exporting loans:', error);
    if (!res.headersSent) {
      res.status(500).json({ status: "error", message: 'Failed to export loans' });
    } else {
      res.end();
    }
  }
};
