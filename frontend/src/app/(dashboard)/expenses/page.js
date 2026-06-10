'use client';

import { useState, useMemo } from 'react';
import ExpenseForm from '@/components/forms/ExpenseForm';
import { mockExpenses, generateExpenseId } from '@/mock/expenses';
import { formatCurrency, formatDate } from '@/utils/formatting';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '@/components/tables/DataTable';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/tables/Pagination';
import { ITEMS_PER_PAGE } from '@/utils/constants';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [showForm, setShowForm] = useState(false);
  const [officeExpensesOnly, setOfficeExpensesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);

  // Filter data
  const filteredData = useMemo(() => {
    let data = expenses;
    if (officeExpensesOnly) {
      data = data.filter((item) => item.type === 'Office');
    }
    // Sort by date descending
    return data.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [officeExpensesOnly, expenses]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleFilterChange = (checked) => {
    setOfficeExpensesOnly(checked);
    setCurrentPage(1);
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleAddExpense = () => {
    setShowForm(true);
  };

  const handleFormSubmit = (data) => {
    const newExpense = {
      id: generateExpenseId(),
      ...data,
    };
    setExpenses((prev) => [newExpense, ...prev]);
    toast.success('Expense recorded successfully!');
    setShowForm(false);
  };

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (val) =>
        new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(new Date(val)),
    },
    {
      key: 'loanNumber',
      label: 'Loan #',
      render: (val, row) => (
        <span className="inline-flex rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-semibold text-[#2563eb] uppercase tracking-wider">
          {row.type === 'Office' ? 'OFFICE' : val}
        </span>
      ),
    },
    {
      key: 'vehicleNumber',
      label: 'Vehicle #',
      render: (val) => val || '-',
    },
    {
      key: 'particulars',
      label: 'Particulars',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => formatCurrency(val),
    },
  ];

  return (
    <>
      <PageHeader
        title="Expense Management"
        description="Track and manage operational expenditures"
      >
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 rounded-lg border border-border-custom bg-white px-4 py-2 cursor-pointer hover:bg-background-custom transition-all">
            <input
              type="checkbox"
              checked={officeExpensesOnly}
              onChange={(e) => handleFilterChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">
              Office Expenses Only
            </span>
          </label>
          <button
            onClick={handleAddExpense}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white bg-primary hover:bg-secondary transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Add Expense
          </button>
        </div>
      </PageHeader>

      {/* Rows per page selector & status */}
      <div className="mb-4 flex items-center justify-end gap-3 mt-4">
        <span className="text-sm text-text-secondary font-medium">
          Showing <strong>{filteredData.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> expenses
        </span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rows:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => handleRowsPerPageChange(e.target.value)}
            className="rounded-lg border border-border-custom bg-background-custom px-2 py-1 text-xs font-semibold text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            {[5, 10, 25, 50].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg bg-white shadow">
        <DataTable columns={columns} data={paginatedData} />
      </div>

      <div className="mt-0 rounded-b-lg border border-t-0 border-border-custom bg-white">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showForm && (
        <ExpenseForm
          onSubmit={handleFormSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
