import { z } from 'zod';

const permissiveNumber = z.preprocess((val) => {
  if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
    return undefined;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? undefined : parsed;
}, z.number().optional());

export const createLoanSchema = z.object({
  // Section 1: System Information
  status: z.string().nullable().optional().default('Active'),

  // Section 2: Customer Details
  loanNumber: z.string().min(1, 'Loan number is required').max(50),
  customerName: z.string().nullable().optional().or(z.literal('')),
  currentAddress: z.string().nullable().optional().or(z.literal('')),
  ownRent: z.string().nullable().optional(),
  panNumber: z.string().nullable().optional().or(z.literal('')),
  aadharNumber: z.string().nullable().optional().or(z.literal('')),
  guarantorName: z.string().nullable().optional().or(z.literal('')),

  // Mobile Numbers
  primaryMobileNumber: z.string().nullable().optional().or(z.literal('')),
  mobileNumbers: z.array(
    z.object({
      number: z.string().nullable().optional().or(z.literal('')),
    })
  ).optional().nullable(),

  // Guarantor Mobile Numbers
  primaryGuarantorMobile: z.string().nullable().optional().or(z.literal('')),
  guarantorMobileNumbers: z.array(
    z.object({
      number: z.string().nullable().optional().or(z.literal('')),
    })
  ).optional().nullable(),

  // Section 3: Loan Terms & Dates
  totalPrincipalAmount: permissiveNumber,
  processingFeeRate: permissiveNumber,
  processingFeeAmount: permissiveNumber,
  tenure: permissiveNumber,
  interestRate: permissiveNumber,

  // Section 4: Dates & EMI
  dateLoanDisbursed: z.string().nullable().optional().or(z.literal('')),
  emiStartDate: z.string().nullable().optional().or(z.literal('')),
  emiEndDate: z.string().nullable().optional().or(z.literal('')),

  // Section 5: Vehicle Information
  vehicleNumber: z.string().nullable().optional().or(z.literal('')),
  chassisNumber: z.string().nullable().optional().or(z.literal('')),
  engineNumber: z.string().nullable().optional().or(z.literal('')),
  modelYear: permissiveNumber,
  typeOfVehicle: z.string().nullable().optional(),
  boardType: z.string().nullable().optional(),
  dealerName: z.string().nullable().optional().or(z.literal('')),
  dealerNumber: z.string().nullable().optional().or(z.literal('')),
  fcDate: z.string().nullable().optional().or(z.literal('')),
  insuranceDate: z.string().nullable().optional().or(z.literal('')),
  hpEntry: z.string().nullable().optional(),
  rtoPending: z.array(z.string()).optional().nullable(),
  payments: z.any().optional(),
  loanType: z.string().nullable().optional(),

  // Section 6: Status Update (Client Response)
  remarks: z.string().nullable().optional().or(z.literal('')),
  followUpDate: z.string().nullable().optional().or(z.literal('')),
});
