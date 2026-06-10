// Mock data for Expenses — matches the new field structure:
// type (Office/Loan), loanNumber, vehicleNumber, particulars, date, amount

let nextId = 20;
export const generateExpenseId = () => {
  nextId++;
  return nextId;
};

export const mockExpenses = [
  {
    id: 1,
    type: 'Loan',
    loanNumber: 'D24',
    vehicleNumber: '',
    particulars: 'Test',
    date: '2026-05-27',
    amount: 1000,
  },
  {
    id: 2,
    type: 'Loan',
    loanNumber: 'G95',
    vehicleNumber: '',
    particulars: 'For testing',
    date: '2026-05-27',
    amount: 1000,
  },
  {
    id: 3,
    type: 'Loan',
    loanNumber: 'LN-001',
    vehicleNumber: 'KA-03-AB-1234',
    particulars: 'Home visit',
    date: '2026-05-26',
    amount: 500,
  },
  {
    id: 4,
    type: 'Office',
    loanNumber: '',
    vehicleNumber: '',
    particulars: 'board',
    date: '2026-05-21',
    amount: 3000,
  },
  {
    id: 5,
    type: 'Office',
    loanNumber: '',
    vehicleNumber: '',
    particulars: 'Monthly office rent',
    date: '2026-05-01',
    amount: 50000,
  },
  {
    id: 6,
    type: 'Loan',
    loanNumber: 'ML-1001',
    vehicleNumber: 'TN-01-AB-1234',
    particulars: 'Field collection visit',
    date: '2026-05-18',
    amount: 850,
  },
  {
    id: 7,
    type: 'Office',
    loanNumber: '',
    vehicleNumber: '',
    particulars: 'Internet & utilities',
    date: '2026-05-15',
    amount: 5000,
  },
  {
    id: 8,
    type: 'Loan',
    loanNumber: 'WL-002',
    vehicleNumber: 'DL-01-CD-5678',
    particulars: 'Customer follow-up travel',
    date: '2026-05-12',
    amount: 700,
  },
  {
    id: 9,
    type: 'Office',
    loanNumber: '',
    vehicleNumber: '',
    particulars: 'Printer & stationery',
    date: '2026-05-10',
    amount: 3500,
  },
  {
    id: 10,
    type: 'Loan',
    loanNumber: 'DL-003',
    vehicleNumber: 'GJ-01-EF-9012',
    particulars: 'Overdue recovery visit',
    date: '2026-05-08',
    amount: 1200,
  },
  {
    id: 11,
    type: 'Office',
    loanNumber: '',
    vehicleNumber: '',
    particulars: 'Staff refreshments',
    date: '2026-05-05',
    amount: 2200,
  },
  {
    id: 12,
    type: 'Loan',
    loanNumber: 'ML-1011',
    vehicleNumber: 'TN-02-UV-2345',
    particulars: 'Legal notice delivery',
    date: '2026-05-03',
    amount: 600,
  },
];
