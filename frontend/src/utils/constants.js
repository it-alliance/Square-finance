export const ITEMS_PER_PAGE = 10;

export const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: 'TrendingUp',
  },
  {
    id: 'to-do-list',
    label: 'To-Do List',
    href: '/todo',
    icon: 'ClipboardList',
  },
  {
    id: 'collections',
    label: 'Collections',
    href: '/collections',
    icon: 'Briefcase',
  },
  {
    id: 'loans',
    label: 'Loans',
    href: '/loans',
    icon: 'Banknote',
    subItems: [
      { id: 'monthly-loans', label: 'Monthly Loans', href: '/monthly-loans' },
      { id: 'weekly-loans', label: 'Weekly Loans', href: '/weekly-loans' },
      { id: 'daily-loans', label: 'Daily Loans', href: '/daily-loans' },
      { id: 'interest-loans', label: 'Interest Loans', href: '/interest-loans' },
    ]
  },
  {
    id: 'employees',
    label: 'Employees',
    href: '/employees',
    icon: 'Users',
  },
  {
    id: 'seized-vehicles',
    label: 'Seized Vehicles',
    href: '/seized-vehicles',
    icon: 'Car',
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    icon: 'Wallet',
    subItems: [
      { id: 'pending-payments', label: 'Pending', href: '/payments/pending' },
      { id: 'partial-payments', label: 'Partial', href: '/payments/partial' },
      { id: 'followup-payments', label: 'Followup', href: '/payments/followup' },
      { id: 'foreclosure-payments', label: 'Foreclosure', href: '/payments/foreclosure' },
    ]
  },
  {
    id: 'approvals',
    label: 'Approvals',
    href: '/approvals',
    icon: 'CheckCircle',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    href: '/expenses',
    icon: 'Receipt',
  },
  {
    id: 'documents',
    label: 'Documents',
    href: '/documents',
    icon: 'FileText',
    subItems: [
      { id: 'noc-documents', label: 'NOC', href: '/documents/noc' },
      { id: 'seizing-notice', label: 'Seizing Notice', href: '/documents/seizing-notice' },
    ]
  }
];

export const EXPENSE_CATEGORIES = [
  'Office',
  'Travel',
  'Maintenance',
  'Salary',
  'Miscellaneous',
];

export const APPROVAL_TYPES = [
  'Loan Approval',
  'Expense Approval',
  'Employee Approval',
];

export const LOAN_STATUSES = ['Active', 'Overdue', 'Closed'];

export const EMPLOYEE_STATUSES = ['Active', 'Inactive'];

export const APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'];
