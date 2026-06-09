'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import TableFilters from '@/components/tables/TableFilters';
import { formatCurrency, formatDate } from '@/utils/formatting';
import { LOAN_STATUSES } from '@/utils/constants';
import { Eye, Edit2, Plus, Trash2, MoreVertical, RefreshCw, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';
import { apiClient } from '@/utils/apiClient';

const LIMIT = 10;

export default function MonthlyLoansPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cursor-based pagination
  const [cursors, setCursors] = useState([null]); // cursors[0] = null (page 1 start)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Debounce timer ref
  const debounceRef = useRef(null);

  // Build query params from current state
  const buildParams = useCallback((cursor) => {
    const params = new URLSearchParams();
    params.set('limit', String(LIMIT));
    if (cursor) params.set('cursor', cursor);
    if (searchTerm.trim()) {
      // Detect what the user is searching by
      if (/^\d+$/.test(searchTerm.trim())) {
        params.set('mobileNumber', searchTerm.trim());
      } else if (searchTerm.trim().toUpperCase().match(/^[A-Z]{2}/)) {
        params.set('vehicleNumber', searchTerm.trim());
      } else {
        params.set('customerName', searchTerm.trim());
      }
    }
    if (activeFilters.status) params.set('status', activeFilters.status);
    return params.toString();
  }, [searchTerm, activeFilters]);

  // Fetch loans from API
  const fetchLoans = useCallback(async (cursor) => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildParams(cursor);
      const res = await apiClient.get(`/monthly-loans?${qs}`);
      if (res.success) {
        // Map API fields to what the table expects
        const mapped = res.data.map((loan) => ({
          id: loan.id,
          loanNumber: loan.loanNumber,
          customerName: loan.customer?.name ?? '—',
          vehicleNumber: loan.vehicleNumber,
          mobile: loan.customer?.primaryMobile ?? '—',
          loanAmount: loan.totalPrincipalAmount,
          emiAmount: loan.monthlyEMI,
          tenure: loan.tenure,
          status: loan.status,
          clientResponse: loan.followUps?.[0]?.employeeComment ?? '—',
          nextFollowupDate: loan.nextFollowupDate,
        }));
        setLoans(mapped);
        setNextCursor(res.nextCursor ?? null);
      } else {
        throw new Error('Failed to fetch loans');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      toast.error('Failed to load monthly loans');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // Initial load & whenever filters/search change → reset to page 1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCursors([null]);
      setCurrentPageIndex(0);
      fetchLoans(null);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, activeFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // ── Pagination handlers ──────────────────────────────────────────────────────
  const goNext = () => {
    if (!nextCursor) return;
    const newCursors = [...cursors, nextCursor];
    setCursors(newCursors);
    const newIndex = currentPageIndex + 1;
    setCurrentPageIndex(newIndex);
    fetchLoans(nextCursor);
  };

  const goPrev = () => {
    if (currentPageIndex === 0) return;
    const newIndex = currentPageIndex - 1;
    setCurrentPageIndex(newIndex);
    fetchLoans(cursors[newIndex]);
  };

  // ── Export ───────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      toast.loading('Generating export…', { id: 'export' });
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const qs = new URLSearchParams();
      if (activeFilters.status) qs.set('status', activeFilters.status);

      const res = await fetch(`http://127.0.0.1:4000/api/monthly-loans/export?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'monthly_loans.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded!', { id: 'export' });
    } catch {
      toast.error('Export failed', { id: 'export' });
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
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
            onChange={setSearchTerm}
            placeholder="Search by customer name, vehicle, or mobile…"
          />
          <div className="flex items-center gap-2">
            <TableFilters
              filters={[{ key: 'status', label: 'Filter by Status', options: LOAN_STATUSES }]}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
            <button
              onClick={() => fetchLoans(cursors[currentPageIndex])}
              className="flex items-center gap-1.5 rounded-lg border border-border-custom bg-white px-3 py-2 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-sm text-text-secondary font-medium">
          Page <strong>{currentPageIndex + 1}</strong> · Showing <strong>{loans.length}</strong> loans
        </p>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading monthly loans…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-danger">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => fetchLoans(cursors[currentPageIndex])}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-secondary transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loans.length === 0 ? (
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
              {loans.map((row, index) => {
                const isOpen = activeDropdownId === row.id;
                const openUpward = loans.length > 2 && index >= loans.length - 2;
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

      {/* Cursor Pagination */}
      {!loading && !error && (
        <div className="mt-0 flex items-center justify-between rounded-b-lg border border-t-0 border-border-custom bg-white px-5 py-3">
          <p className="text-xs font-semibold text-text-secondary">
            Page {currentPageIndex + 1}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              disabled={currentPageIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-text-primary">{currentPageIndex + 1}</span>
            <button
              onClick={goNext}
              disabled={!nextCursor}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
