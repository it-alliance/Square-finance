# Square Finance - Loan Management System

A production-ready frontend for a Loan Management System built with **Next.js 15 (App Router)**, **React**, **Tailwind CSS**, **Shadcn UI components**, and **Zustand** state management.

## 🎯 Overview

This is a complete, fully functional Loan Management System frontend with:
- ✅ Authentication & Authorization
- ✅ Dashboard with real-time statistics
- ✅ Monthly Loans Management
- ✅ Payment Management (with tabs: Pending, Partial, Follow-ups, Foreclosure)
- ✅ Employee Management
- ✅ Approvals Management
- ✅ Expense Management
- ✅ Responsive Mobile UI
- ✅ Mock Data Integration
- ✅ Form Validation with Zod & React Hook Form
- ✅ Search, Filter, and Pagination
- ✅ Modal Dialogs for Add/Edit/View operations

## 🚀 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React Framework with App Router |
| **JavaScript** | Programming Language |
| **React 19** | UI Library |
| **Tailwind CSS 4** | Styling |
| **Zustand** | State Management |
| **React Hook Form** | Form Management |
| **Zod** | Schema Validation |
| **Lucide React** | Icons |
| **date-fns** | Date Formatting |

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/page.js         # Login page
│   │   └── layout.js             # Auth layout
│   ├── (dashboard)/              # Dashboard routes group
│   │   ├── page.js               # Dashboard home
│   │   ├── layout.js             # Dashboard layout with Sidebar
│   │   ├── monthly-loans/
│   │   │   ├── page.js           # Loans list
│   │   │   └── payments/page.js  # Payments management (tabs)
│   │   ├── employees/page.js     # Employee management
│   │   ├── approvals/page.js     # Approvals management
│   │   └── expenses/page.js      # Expense management
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Root redirect
│   └── globals.css               # Global styles
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx         # Main app layout wrapper
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   └── Navbar.jsx            # Top navigation bar
│   ├── common/
│   │   ├── PageHeader.jsx        # Reusable page header
│   │   ├── SearchInput.jsx       # Search component
│   │   ├── StatusBadge.jsx       # Status badge
│   │   ├── EmptyState.jsx        # Empty state UI
│   │   └── LoadingState.jsx      # Loading skeleton
│   ├── tables/
│   │   ├── DataTable.jsx         # Generic data table
│   │   ├── Pagination.jsx        # Pagination controls
│   │   └── TableFilters.jsx      # Filter controls
│   └── forms/
│       ├── EmployeeForm.jsx      # Employee modal form
│       └── ExpenseForm.jsx       # Expense modal form
│
├── mock/                         # Mock data
│   ├── loans.js                  # Loan data
│   ├── payments.js               # Payment data
│   ├── employees.js              # Employee data
│   ├── approvals.js              # Approval data
│   └── expenses.js               # Expense data
│
├── store/                        # Zustand stores
│   ├── authStore.js              # Authentication state
│   └── sidebarStore.js           # Sidebar state
│
└── utils/
    ├── formatting.js             # Formatting helpers
    └── constants.js              # Constants & configs
```

## 🔐 Authentication

**Login Page**: `/login`
- Form validation with React Hook Form + Zod
- Password visibility toggle
- Remember me checkbox
- Error handling with display
- Mock authentication (demo credentials: username: `demo`, password: `demo`)
- Redirects to dashboard after successful login
- Automatic redirect to login if accessing protected routes without authentication

**Demo Credentials**:
```
Username: demo
Password: demo
```

## 📊 Modules

### 1. Dashboard (`/`)
- Statistics cards showing:
  - Active Loans count
  - Pending Approvals count
  - Total Employees
  - Total Expenses
- Recent loans table
- Recent approvals table
- Quick links to all modules

### 2. Monthly Loans (`/monthly-loans`)
**Features**:
- Searchable table with columns:
  - Loan Number, Customer Name, Vehicle Number
  - Loan Amount, EMI Amount, Due Date, Status, Actions
- Filter by Status (Active, Overdue, Closed)
- Pagination with smart page navigation
- View loan details modal
- Edit button functionality
- Mock data with 8 sample loans

**Payments Sub-Module** (`/monthly-loans/payments`):
- **Pending Payments Tab**: Outstanding payments due
- **Partial Payments Tab**: Partially paid loans
- **Follow-ups Tab**: Customer follow-up history
- **Foreclosure Tab**: Settlement information
- Tab-based interface with search & filtering
- Action buttons for each tab type

### 3. Employees (`/employees`)
**Features**:
- Employee list with columns:
  - ID, Name, Designation, Phone, Email, Status
- Search by name, ID, or email
- Filter by Status (Active, Inactive)
- Add new employee button
- View employee details
- Edit employee modal form
- Delete with confirmation
- Form validation

### 4. Approvals (`/approvals`)
**Features**:
- Approval list with columns:
  - ID, Type, Requested By, Date, Status, Actions
- Filter by Type & Status
- Search by ID or requester
- Approve/Reject functionality (for pending approvals)
- View approval details
- Status indicators
- Mock data with various approval types

### 5. Expenses (`/expenses`)
**Features**:
- Expense list with columns:
  - ID, Name, Category, Amount, Date, Status, Actions
- Search and filter capabilities
- Summary cards showing:
  - Total expenses
  - Breakdown by category
- Add/Edit/Delete expenses
- Form validation with Zod
- Category filter (Office, Travel, Maintenance, Salary, Miscellaneous)
- Currency formatting

## 🎨 UI Components

### Reusable Components

**PageHeader** - Page title and breadcrumb
```jsx
<PageHeader 
  title="Monthly Loans"
  description="Manage all active and closed loans"
>
  <button>Add Loan</button>
</PageHeader>
```

**SearchInput** - Search field with clear button
```jsx
<SearchInput 
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search..."
/>
```

**StatusBadge** - Colored status indicators
```jsx
<StatusBadge status="Active" />
```

**DataTable** - Generic table with custom columns
```jsx
<DataTable 
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
/>
```

**Pagination** - Smart pagination with page numbers
```jsx
<Pagination 
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

**Modal Forms** - Reusable form modals
```jsx
<EmployeeForm 
  employee={editingEmployee}
  onSubmit={handleSubmit}
  onClose={handleClose}
/>
```

## 🛠 State Management

### Zustand Stores

**authStore** - Authentication state with persist middleware
- `user` - Current user object
- `isAuthenticated` - Auth flag
- `login()` - Mock login with validation
- `logout()` - Clear auth state
- LocalStorage persistence for session management

**sidebarStore** - Sidebar state
- `isOpen` - Sidebar visibility on mobile
- `toggleSidebar()` - Toggle function
- Mobile responsive drawer management

## 📱 Responsive Design

- **Mobile First** approach with Tailwind CSS
- **Breakpoints**: sm, md, lg, xl
- **Sidebar**: Fixed navigation on desktop, collapsible drawer on mobile
- **Tables**: Responsive with horizontal scroll on small screens
- **Forms**: Full-width on mobile, optimized width on desktop

## 🔄 Features

### Search & Filter
- Real-time search across multiple fields
- Multi-field filtering
- Clear all filters button
- Result count display

### Pagination
- Smart page number display
- Previous/Next navigation
- Jump to page functionality
- Dynamic page calculation

### Form Management
- React Hook Form integration
- Zod schema validation
- Real-time error display
- Modal-based add/edit forms
- Default values support

### Data Operations
- View details in modals
- Edit existing records
- Delete with confirmation
- Add new records
- In-memory state updates (no backend)

## 🎯 Key Features

✅ **Production-Ready Code**
- Clean, modular architecture
- Reusable components
- Proper error handling
- Type-safe form validation

✅ **Responsive Design**
- Mobile-first approach
- Touch-friendly UI
- Optimized for all devices

✅ **User Experience**
- Intuitive navigation
- Clear visual hierarchy
- Loading states
- Empty states
- Success/Error feedback

✅ **Mock Data**
- Realistic sample data
- 8 loans, 6 employees, 6 expenses, 6 approvals
- Various statuses and categories
- Easy to extend

✅ **Accessibility**
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Focus management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm build

# Start production server
npm start
```

Visit `http://localhost:3000` in your browser.

## 📝 Login Credentials

For testing, use these credentials:

```
Username: demo
Password: demo
```

Any username with a password of 4+ characters will work in mock mode.

## 🎓 Code Examples

### Creating a New Page

```javascript
'use client';

import PageHeader from '@/components/common/PageHeader';
import AppLayout from '@/components/layout/AppLayout';

export default function NewPage() {
  return (
    <>
      <PageHeader title="New Module" />
      {/* Your content */}
    </>
  );
}
```

### Using Search & Filter

```javascript
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState({});

const filtered = useMemo(() => {
  let data = searchFilter(items, searchTerm, ['name', 'email']);
  if (filters.status) {
    data = data.filter(item => item.status === filters.status);
  }
  return data;
}, [searchTerm, filters]);
```

### Adding a Modal Form

```javascript
import EmployeeForm from '@/components/forms/EmployeeForm';

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  
  return (
    <>
      {/* Page content */}
      {showForm && (
        <EmployeeForm
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
```

## 📊 Mock Data Structure

Each module has realistic mock data:

**Loans**
- Loan Number, Customer Name, Vehicle Number
- Loan Amount, EMI Amount, Due Date
- Status: Active, Overdue, Closed

**Employees**
- Employee ID, Name, Designation
- Phone, Email, Status
- Joining Date

**Approvals**
- Approval ID, Type, Requested By
- Date, Status, Description

**Expenses**
- Expense ID, Name, Category
- Amount, Date, Status, Description

## 🔧 Customization

### Adding a New Module

1. Create route folder in `src/app/(dashboard)/module-name/`
2. Create `page.js` with your component
3. Add menu item to `utils/constants.js`
4. Create mock data in `src/mock/module-name.js`
5. Use reusable components for UI

### Modifying Styling

- Global styles: `src/app/globals.css`
- Tailwind config: `tailwind.config.js`
- Component-level: Use Tailwind classes directly

### Adding Backend Integration

1. Create API service in `src/utils/api.js`
2. Replace mock data with API calls
3. Handle loading and error states
4. Update type definitions if using TypeScript

## 📦 File Size & Performance

- Optimized bundle size with Next.js
- Code splitting per route
- Image optimization ready
- CSS optimization with Tailwind
- Fast development reload with Turbopack

## 🐛 Troubleshooting

**Authentication not persisting on refresh**
- Auth state uses localStorage (configured in zustand persist middleware)
- Clear browser cache if needed

**Styling issues**
- Clear `.next` folder and rebuild
- Ensure Tailwind CSS is properly configured

**Port 3000 already in use**
- Kill process: `taskkill /PID <PID> /F` (Windows)
- Or use: `lsof -ti:3000 | xargs kill -9` (Mac/Linux)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

## 📄 License

This project is created as a demo application for learning purposes.

## 🤝 Contributing

Feel free to fork and extend this project with additional features:
- Backend API integration
- User authentication with JWT
- Database persistence
- Real payment gateway integration
- Email notifications
- PDF report generation
- Analytics dashboard

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**

For more information, check out the code structure and individual component files.
