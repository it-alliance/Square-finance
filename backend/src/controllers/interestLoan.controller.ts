import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Helper to format the response to match the exact blueprint
const formatLoanResponse = (loan: any) => {
  return {
    id: loan.id,
    customerDetails: {
      customerName: loan.customer?.name || "",
      address: loan.customer?.currentAddress || "",
      ownRent: loan.customer?.ownRent || "",
      mobileNumbers: [loan.customer?.primaryMobile, ...(Array.isArray(loan.customer?.mobileNumbers) ? loan.customer.mobileNumbers : [])].filter(Boolean),
      panNumber: loan.customer?.panNumber || "",
      aadharNumber: loan.customer?.aadharNumber || "",
      guarantorName: loan.customer?.guarantorName || "",
      guarantorMobileNumbers: [loan.customer?.primaryGuarantorMobile, ...(Array.isArray(loan.customer?.guarantorMobileNumbers) ? loan.customer.guarantorMobileNumbers : [])].filter(Boolean)
    },
    loanTerms: {
      loanNumber: loan.loanNumber,
      principalAmount: loan.totalPrincipalAmount,
      remainingPrincipalAmount: loan.remainingPrincipalAmount,
      processingFeeRate: loan.processingFeeRate,
      processingFee: loan.processingFee,
      interestRate: loan.interestRate,
      monthlyInterest: loan.monthlyInterest,
      dateLoanDisbursed: loan.dateLoanDisbursed,
      interestStartDate: loan.interestStartDate,
      totalInterestCollected: loan.totalInterestCollected,
      totalPrincipalCollected: loan.totalPrincipalCollected
    },
    pledgeInformation: {
      pledgeDetails: loan.pledgeDetails || ""
    },
    status: {
      status: loan.status,
      nextFollowUpDate: loan.nextFollowupDate || "",
      clientResponse: loan.clientResponse || "",
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt
    }
  };
};

export const createInterestLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerDetails, loanTerms, pledgeInformation, status } = req.body;

    // Check if customer exists by primary mobile
    let customer = await prisma.customer.findFirst({
      where: { primaryMobile: customerDetails.mobileNumbers[0] }
    });

    // Create customer if they don't exist
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerDetails.customerName,
          currentAddress: customerDetails.address,
          ownRent: customerDetails.ownRent,
          primaryMobile: customerDetails.mobileNumbers[0],
          mobileNumbers: customerDetails.mobileNumbers.slice(1),
          panNumber: customerDetails.panNumber,
          aadharNumber: customerDetails.aadharNumber,
          guarantorName: customerDetails.guarantorName,
          primaryGuarantorMobile: customerDetails.guarantorMobileNumbers?.[0],
          guarantorMobileNumbers: customerDetails.guarantorMobileNumbers?.slice(1)
        }
      });
    }

    const principal = loanTerms.principalAmount || 0;
    const interestRate = loanTerms.interestRate || 0;
    const monthlyInterest = loanTerms.monthlyInterest || (principal * interestRate / 100);

    const loan = await prisma.interestLoan.create({
      data: {
        loanNumber: loanTerms.loanNumber,
        customerId: customer.id,
        pledgeDetails: pledgeInformation?.pledgeDetails || "",
        totalPrincipalAmount: principal,
        remainingPrincipalAmount: principal,
        processingFeeRate: loanTerms.processingFeeRate || 0,
        processingFee: loanTerms.processingFee || 0,
        interestRate: interestRate,
        monthlyInterest: monthlyInterest,
        dateLoanDisbursed: new Date(loanTerms.dateLoanDisbursed || new Date()),
        interestStartDate: new Date(loanTerms.interestStartDate || new Date()),
        status: status?.status || "Active",
        nextFollowupDate: status?.nextFollowUpDate ? new Date(status.nextFollowUpDate) : null,
        clientResponse: status?.clientResponse || ""
      },
      include: { customer: true }
    });

    res.status(201).json({ status: "success", message: "Interest loan created successfully", data: formatLoanResponse(loan) });
  } catch (error: any) {
    console.error('Error creating interest loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to create loan', data: error.message });
  }
};

export const updateInterestLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { loanTerms, pledgeInformation, status } = req.body;

    const existingLoan = await prisma.interestLoan.findUnique({ where: { id } });
    if (!existingLoan) {
      res.status(404).json({ status: "error", message: "Loan not found" });
      return;
    }

    const updateData: any = {};
    if (loanTerms) {
      if (loanTerms.principalAmount !== undefined) updateData.totalPrincipalAmount = loanTerms.principalAmount;
      if (loanTerms.remainingPrincipalAmount !== undefined) {
         updateData.remainingPrincipalAmount = loanTerms.remainingPrincipalAmount;
         // Recalculate monthly interest based on new remaining principal
         const rate = loanTerms.interestRate !== undefined ? loanTerms.interestRate : existingLoan.interestRate;
         updateData.monthlyInterest = loanTerms.remainingPrincipalAmount * (rate / 100);
      }
      if (loanTerms.processingFeeRate !== undefined) updateData.processingFeeRate = loanTerms.processingFeeRate;
      if (loanTerms.processingFee !== undefined) updateData.processingFee = loanTerms.processingFee;
      if (loanTerms.interestRate !== undefined && loanTerms.remainingPrincipalAmount === undefined) {
         updateData.interestRate = loanTerms.interestRate;
         updateData.monthlyInterest = existingLoan.remainingPrincipalAmount * (loanTerms.interestRate / 100);
      }
      if (loanTerms.dateLoanDisbursed !== undefined) updateData.dateLoanDisbursed = new Date(loanTerms.dateLoanDisbursed);
      if (loanTerms.interestStartDate !== undefined) updateData.interestStartDate = new Date(loanTerms.interestStartDate);
      if (loanTerms.totalInterestCollected !== undefined) updateData.totalInterestCollected = loanTerms.totalInterestCollected;
      if (loanTerms.totalPrincipalCollected !== undefined) updateData.totalPrincipalCollected = loanTerms.totalPrincipalCollected;
    }

    if (pledgeInformation?.pledgeDetails !== undefined) {
      updateData.pledgeDetails = pledgeInformation.pledgeDetails;
    }

    if (status) {
      if (status.status !== undefined) updateData.status = status.status;
      if (status.nextFollowUpDate !== undefined) updateData.nextFollowupDate = status.nextFollowUpDate ? new Date(status.nextFollowUpDate) : null;
      if (status.clientResponse !== undefined) updateData.clientResponse = status.clientResponse;
    }

    const updatedLoan = await prisma.interestLoan.update({
      where: { id },
      data: updateData,
      include: { customer: true }
    });

    res.status(200).json({ status: "success", message: "Interest loan updated successfully", data: formatLoanResponse(updatedLoan) });
  } catch (error: any) {
    console.error('Error updating interest loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to update loan', data: error.message });
  }
};

export const getInterestLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '10',
      loanNumber,
      customerName,
      mobileNumber,
      status
    } = req.query;

    const take = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const skip = (pageNum - 1) * take;

    const where: any = { isDeleted: false };
    
    if (loanNumber) where.loanNumber = { startsWith: loanNumber as string, mode: 'insensitive' };
    if (status) where.status = status as string;
    
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
      prisma.interestLoan.findMany(queryOptions),
      prisma.interestLoan.count({ where })
    ]);

    const totalPages = Math.ceil(totalItems / take);
    const formattedLoans = loans.map(formatLoanResponse);

    res.status(200).json({
      status: "success",
      message: "Interest loans fetched successfully",
      data: {
        data: formattedLoans,
        items: totalItems,
        limit: take,
        "current page": pageNum,
        "total number of pages": totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching interest loans:', error);
    res.status(500).json({ status: "error", message: 'Failed to fetch loans', data: error.message });
  }
};

export const deleteInterestLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const loan = await prisma.interestLoan.findUnique({ where: { id } });
    if (!loan) {
      res.status(404).json({ status: "error", message: "Loan not found" });
      return;
    }

    await prisma.interestLoan.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.status(200).json({ status: "success", message: "Loan deleted successfully" });
  } catch (error: any) {
    console.error('Error deleting loan:', error);
    res.status(500).json({ status: "error", message: 'Failed to delete loan', data: error.message });
  }
};
