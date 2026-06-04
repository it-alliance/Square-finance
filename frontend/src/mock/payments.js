export const mockPendingPayments = [
  {
    id: 1,
    loanNumber: 'LN001',
    customerName: 'Raj Kumar',
    dueAmount: 12500,
    dueDate: '2026-06-15',
  },
  {
    id: 2,
    loanNumber: 'LN003',
    customerName: 'Amit Patel',
    dueAmount: 15000,
    dueDate: '2026-06-10',
  },
  {
    id: 3,
    loanNumber: 'LN007',
    customerName: 'Vikram Singh',
    dueAmount: 17500,
    dueDate: '2026-06-18',
  },
  {
    id: 4,
    loanNumber: 'LN004',
    customerName: 'Neha Verma',
    dueAmount: 11250,
    dueDate: '2026-06-25',
  },
];

export const mockPartialPayments = [
  {
    id: 1,
    loanNumber: 'LN002',
    customerName: 'Priya Singh',
    totalAmount: 18750,
    paidAmount: 12500,
    balanceAmount: 6250,
  },
  {
    id: 2,
    loanNumber: 'LN006',
    customerName: 'Divya Sharma',
    totalAmount: 13750,
    paidAmount: 8000,
    balanceAmount: 5750,
  },
  {
    id: 3,
    loanNumber: 'LN005',
    customerName: 'Arjun Das',
    totalAmount: 20000,
    paidAmount: 15000,
    balanceAmount: 5000,
  },
];

export const mockFollowUps = [
  {
    id: 1,
    loanNumber: 'LN001',
    customerName: 'Raj Kumar',
    lastFollowUpDate: '2026-05-28',
    nextFollowUpDate: '2026-06-10',
    remarks: 'Customer promised payment on due date',
  },
  {
    id: 2,
    loanNumber: 'LN003',
    customerName: 'Amit Patel',
    lastFollowUpDate: '2026-05-20',
    nextFollowUpDate: '2026-06-05',
    remarks: 'Requested extension, considering',
  },
  {
    id: 3,
    loanNumber: 'LN007',
    customerName: 'Vikram Singh',
    lastFollowUpDate: '2026-05-15',
    nextFollowUpDate: '2026-06-08',
    remarks: 'Customer not responding to calls',
  },
  {
    id: 4,
    loanNumber: 'LN004',
    customerName: 'Neha Verma',
    lastFollowUpDate: '2026-05-25',
    nextFollowUpDate: '2026-06-15',
    remarks: 'Payment confirmation received',
  },
];

export const mockForeclosure = [
  {
    id: 1,
    loanNumber: 'LN001',
    customerName: 'Raj Kumar',
    outstandingAmount: 75000,
    settlementAmount: 70000,
    status: 'Pending',
  },
  {
    id: 2,
    loanNumber: 'LN003',
    customerName: 'Amit Patel',
    outstandingAmount: 120000,
    settlementAmount: 110000,
    status: 'In Progress',
  },
  {
    id: 3,
    loanNumber: 'LN007',
    customerName: 'Vikram Singh',
    outstandingAmount: 150000,
    settlementAmount: 140000,
    status: 'Settled',
  },
];
