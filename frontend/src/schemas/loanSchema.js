import { z } from 'zod';

export const createLoanSchema = z.object({
  // Section 1: System Information
  status: z.enum(['Active', 'Closed', 'Seized', 'Pending']),

  // Section 2: Customer Details
  loanNumber: z.string().min(1, 'Loan number is required').max(50),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  currentAddress: z.string().min(5, 'Address must be at least 5 characters').max(200),
  ownRent: z.enum(['Own', 'Rent']),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional().or(z.literal('')),
  aadharNumber: z.string().regex(/^[0-9]{12}$/, 'Aadhar must be 12 digits').optional().or(z.literal('')),
  guarantorName: z.string().max(100).optional().or(z.literal('')),
  
  // Mobile Numbers
  primaryMobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  mobileNumbers: z.array(
    z.object({
      number: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
    })
  ).optional(),

  // Guarantor Mobile Numbers
  primaryGuarantorMobile: z.string().regex(/^[0-9]{10}$/, 'Guarantor mobile must be 10 digits').optional().or(z.literal('')),
  guarantorMobileNumbers: z.array(
    z.object({
      number: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
    })
  ).optional(),

  // Section 3: Loan Terms
  totalPrincipalAmount: z.number().min(0, 'Principal amount must be at least 0'),
  processingFeeRate: z.number().min(0).max(100, 'Processing fee rate must be between 0-100'),
  tenure: z.number().int().positive('Tenure must be positive'),
  interestRate: z.number().min(0).max(100, 'Interest rate must be between 0-100'),

  // Section 4: Dates & EMI
  dateLoanDisbursed: z.string().min(1, 'Loan disbursal date is required'),
  emiStartDate: z.string().min(1, 'EMI start date is required'),
  emiEndDate: z.string().min(1, 'EMI end date is required'),

  // Section 5: Vehicle Information
  vehicleNumber: z.string().min(2, 'Vehicle number is required').max(20),
  chassisNumber: z.string().min(2, 'Chassis number is required').max(30),
  engineNumber: z.string().min(2, 'Engine number is required').max(30),
  modelYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  typeOfVehicle: z.enum(['2-Wheeler', '3-Wheeler', '4-Wheeler', 'Commercial']),
  boardType: z.enum(['Yellow', 'White']),
  dealerName: z.string().max(100).optional().or(z.literal('')),
  dealerNumber: z.string().regex(/^[0-9]{10}$/, 'Dealer number must be 10 digits').optional().or(z.literal('')),
  fcDate: z.string().optional().or(z.literal('')),
  insuranceDate: z.string().optional().or(z.literal('')),
  hpEntry: z.enum(['Applied', 'Not Done', 'Finished']),
  rtoPending: z.array(z.string()).optional(),
  payments: z.any().optional(),
  loanType: z.enum(['Monthly', 'Weekly', 'Daily', 'Interest']).optional(),

  // Section 6: Status Update
  remarks: z.string().max(500).optional().or(z.literal('')),
  followUpDate: z.string().optional().or(z.literal('')),
});
