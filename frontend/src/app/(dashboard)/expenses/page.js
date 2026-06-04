'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import ExpenseForm from '@/components/forms/ExpenseForm';
import TableFilters from '@/components/tables/TableFilters';
import { mockExpenses } from '@/mock/expenses';
import { formatCurrency, formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE, EXPENSE_CATEGORIES } from '@/utils/constants';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';

export default function ExpensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenses, setExpenses] = useState(mockExpenses);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Filter and search
  const filteredData = useMemo(() => {
    let data = searchFilter(expenses, searchTerm, [
      'expenseId',
      'expenseName',
      'description',
    ]);

    if (activeFilters.category) {
      data = data.filter((item) => item.category === activeFilters.category);
    }

    return data;
  }, [searchTerm, activeFilters, expenses]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleFormSubmit = (data) => {
    if (editingExpense) {
      // Update existing expense
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === editingExpense.id ? { ...exp, ...data } : exp
        )
      );
    } else {
      // Add new expense
      setExpenses((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          expenseId: `EXP${String(prev.length + 1).padStart(3, '0')}`,
          status: 'Pending',
          ...data,
        },
      ]);
    }
    toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense created successfully!');
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id) => {
    confirmToast('Are you sure you want to delete this expense?', () => {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      toast.success('Expense deleted successfully!');
    });
  };

  // Calculate total
  const totalAmount = filteredData.reduce((sum, expense) => sum + expense.amount, 0);

  const columns = [
    { key: 'expenseId', label: 'Expense ID' },
    { key: 'expenseName', label: 'Expense Name' },
    { key: 'category', label: 'Category' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedExpense(row)}
            className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditExpense(row)}
            className="rounded-lg bg-[var(--color-success-bg)] p-2 text-success hover:bg-success/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteExpense(row.id)}
            className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track and manage all business expenses"
      >
        <button
          onClick={handleAddExpense}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Expense
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border-custom bg-card-background p-6 shadow">
          <p className="text-sm font-medium text-text-secondary">Total Expenses</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {formatCurrency(totalAmount)}
          </p>
          <p className="mt-1 text-xs text-text-secondary/80">
            {filteredData.length} expenses in this view
          </p>
        </div>
        <div className="rounded-lg border border-border-custom bg-card-background p-6 shadow">
          <p className="text-sm font-medium text-gray-600">By Category</p>
          <div className="mt-4 space-y-2">
            {EXPENSE_CATEGORIES.slice(0, 3).map((cat) => {
              const count = filteredData.filter((e) => e.category === cat).length;
              const amount = filteredData
                .filter((e) => e.category === cat)
                .reduce((sum, e) => sum + e.amount, 0);
              return (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span>{cat}</span>
                  <span className="font-medium">{count} · {formatCurrency(amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by expense name or ID..."
          />
          <TableFilters
            filters={[
              {
                key: 'category',
                label: 'Filter by Category',
                options: EXPENSE_CATEGORIES,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
        <p className="text-sm text-gray-600">
          Showing {paginatedData.length} of {filteredData.length} expenses
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow">
        <DataTable columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* Expense Detail Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setSelectedExpense(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold">Expense Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Expense ID</p>
                <p className="font-medium">{selectedExpense.expenseId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{selectedExpense.expenseName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-medium">{selectedExpense.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium">
                  {formatCurrency(selectedExpense.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{formatDate(selectedExpense.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-700">
                  {selectedExpense.description}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedExpense.status} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  handleEditExpense(selectedExpense);
                  setSelectedExpense(null);
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedExpense(null)}
                className="flex-1 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary hover:bg-background-custom transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
