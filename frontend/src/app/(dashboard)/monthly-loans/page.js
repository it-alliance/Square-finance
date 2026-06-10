'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import TableFilters from '@/components/tables/TableFilters';
import { formatCurrency } from '@/utils/formatting';
import { LOAN_STATUSES } from '@/utils/constants';
import { Eye, Edit2, Plus, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';
import { mockMonthlyLoans } from '@/mock/monthlyLoans';

const LIMIT = 10;

export default function MonthlyLoansPage() {
  const [loans, setLoans] = useState(mockMonthlyLoans);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // ── In-memory filter + search ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = loans;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.customerName?.toLowerCase().includes(q) ||
          l.vehicleNumber?.toLowerCase().includes(q) ||
          l.mobile?.includes(q) ||
          l.loanNumber?.toLowerCase().includes(q)
      );
    }

    if (activeFilters.status) {
      result = result.filter((l) => l.status === activeFilters.status);
    }

    return result;
  }, [loans, searchTerm, activeFilters]);

  // ── Pagination ────────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / LIMIT));
  const paginated = filtered.slice((currentPage - 1) * LIMIT, currentPage * LIMIT);

  // Reset to page 1 when filters/search change
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // ── Delete handler (mock — removes from local state) ─────────────────────────
  const handleDeleteLoan = (id) => {
    confirmToast('Are you sure you want to delete this loan?', () => {
      setLoans((prev) => prev.filter((l) => l.id !== id));
      toast.success('Loan deleted successfully!');
    });
  };

  // ── Export handler (mock CSV) ─────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const headers = ['Loan Number', 'Customer Name', 'Vehicle Number', 'Mobile', 'Amount', 'EMI', 'Tenure', 'Status'];
      const rows = filtered.map((l) => [
        l.loanNumber, l.customerName, l.vehicleNumber, l.mobile,
        l.loanAmount, l.emiAmount, l.tenure, l.status,
      ]);
      const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monthly_loans.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  const routePrefix = '/monthly-loans';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Monthly Loans"
        description="Manage all active and closed monthly loans"
      >
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary transition-all hover:bg-background-custom"
          >
            Export
          </button>
          <Link
            href={`${routePrefix}/create`}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white bg-primary hover:bg-secondary transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create New Loan
          </Link>
        </div>
      </PageHeader>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by customer name, vehicle, or mobile…"
          />
          <div className="flex items-center gap-2">
            <TableFilters
              filters={[{ key: 'status', label: 'Filter by Status', options: LOAN_STATUSES }]}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </div>
        </div>
        <p className="text-sm text-text-secondary font-medium">
          Page <strong>{currentPage}</strong> · Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> loans
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow overflow-x-auto">
        {paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-text-secondary">
            <p className="text-sm font-semibold">No monthly loans found.</p>
            {(searchTerm || activeFilters.status) && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-primary underline hover:text-secondary"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-gray-100 bg-gray-50/60">
              <tr>
                {['Loan Number', 'Customer Name', 'Vehicle Number', 'Mobile', 'Disbursement', 'EMI', 'Tenure', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((row, index) => {
                const isOpen = activeDropdownId === row.id;
                const openUpward = paginated.length > 2 && index >= paginated.length - 2;
                return (
                  <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <Link
                        href={`${routePrefix}/${row.id}`}
                        className="font-bold text-primary hover:text-secondary hover:underline"
                      >
                        {row.loanNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{row.customerName}</td>
                    <td className="px-5 py-4 text-gray-700">{row.vehicleNumber}</td>
                    <td className="px-5 py-4 text-gray-700">{row.mobile}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{formatCurrency(row.loanAmount)}</td>
                    <td className="px-5 py-4 font-semibold text-gray-800">{formatCurrency(row.emiAmount)}</td>
                    <td className="px-5 py-4 text-gray-700">{row.tenure} mo</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative actions-dropdown-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(isOpen ? null : row.id);
                          }}
                          className="rounded-lg p-1.5 text-text-secondary hover:bg-background-custom hover:text-text-primary transition-colors flex items-center justify-center border border-border-custom cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {isOpen && (
                          <div className={`absolute right-0 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-40 rounded-xl border border-border-custom bg-white p-1.5 shadow-xl shadow-black/5 z-40`}>
                            <Link
                              href={`${routePrefix}/${row.id}`}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-background-custom transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              View Details
                            </Link>
                            <Link
                              href={`${routePrefix}/${row.id}/edit`}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-[var(--color-success-bg)] hover:text-success transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-success" />
                              Edit Loan
                            </Link>
                            <hr className="my-1 border-border-custom" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLoan(row.id);
                                setActiveDropdownId(null);
                              }}
                              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              Delete Loan
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-0 flex items-center justify-between rounded-b-lg border border-t-0 border-border-custom bg-white px-5 py-3">
        <p className="text-xs font-semibold text-text-secondary">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 text-xs font-bold text-text-primary">{currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
