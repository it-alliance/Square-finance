'use client';

import { useState, useMemo } from 'react';
import SearchInput from '@/components/common/SearchInput';
import TableFilters from '@/components/tables/TableFilters';
import { mockApprovals } from '@/mock/approvals';
import { formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE, APPROVAL_TYPES, APPROVAL_STATUSES } from '@/utils/constants';
import { Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Avatar helper ─────────────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';
  return (
    <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
      {initials}
    </span>
  );
}

// ─── Type pill ────────────────────────────────────────────────────────────────
function TypePill({ type }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
      {type}
    </span>
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const styles = {
    Pending:  'bg-amber-50 text-amber-700 border border-amber-200',
    Approved: 'bg-green-50 text-green-700 border border-green-200',
    Rejected: 'bg-red-50   text-red-600   border border-red-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {status}
    </span>
  );
}

// ─── TH ───────────────────────────────────────────────────────────────────────
function TH({ children }) {
  return (
    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 whitespace-nowrap">
      {children}
    </th>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm]             = useState('');
  const [activeFilters, setActiveFilters]       = useState({});
  const [currentPage, setCurrentPage]           = useState(1);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvals, setApprovals]               = useState(mockApprovals);

  const filteredData = useMemo(() => {
    let data = searchFilter(approvals, searchTerm, ['approvalId', 'requestedBy', 'description']);
    data = data.filter((item) => item.status === 'Pending');
    if (activeFilters.type) data = data.filter((item) => item.type === activeFilters.type);
    return data;
  }, [searchTerm, activeFilters, approvals]);

  const totalPages    = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
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

  const handleApprove = (id) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a))
    );
    toast.success('Approval request approved successfully!');
  };

  const handleReject = (id) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a))
    );
    toast.success('Approval request rejected.');
  };

  return (
    <div className="min-h-screen bg-gray-50/60 px-8 py-10">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            APPROVAL QUEUE
          </h1>
          <p className="mt-1 text-sm text-neutral/80">
            Review and authorize pending payment requests
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
          REFRESH
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 md:max-w-sm">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by loan # or customer…"
          />
        </div>
        <TableFilters
          filters={[
            { key: 'type',   label: 'Type',   options: APPROVAL_TYPES },
          ]}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-[24px] border border-gray-100 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">LOAN #</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">CUSTOMER</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">TYPE</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">EMI #</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">AMOUNT</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">MODE</th>
              <th className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80">REQUESTED BY</th>
              <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-[0.15em] text-neutral/80 pr-10">ACTIONS</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-xs font-bold uppercase tracking-widest text-neutral/80">
                  No approval requests match your filters.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isPending = row.status === 'Pending';

                // Mode breakdown
                const modeLines = row.mode && typeof row.mode === 'object'
                  ? Object.entries(row.mode)
                  : row.mode
                    ? [['mode', row.mode]]
                    : [];

                return (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50/30">

                    {/* 1. Loan # */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-primary">
                        {row.approvalId}
                      </span>
                    </td>

                    {/* 2. Customer */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold uppercase tracking-wide text-gray-800">
                        {row.requestedBy}
                      </span>
                    </td>

                    {/* 3. Type */}
                    <td className="px-6 py-5">
                      <TypePill type={row.type} />
                    </td>

                    {/* 4. EMI # */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-neutral">
                        {row.emiNumber ?? '—'}
                      </span>
                    </td>

                    {/* 5. Amount */}
                    <td className="px-6 py-5">
                      <span className="text-sm font-extrabold text-[#10B981]">
                        {row.amount != null
                          ? `₹${Number(row.amount).toLocaleString('en-IN')}`
                          : '—'}
                      </span>
                    </td>

                    {/* 6. Mode — multi-line breakdown */}
                    <td className="px-6 py-5">
                      {modeLines.length > 0 ? (
                        <div className="space-y-1">
                          {modeLines.map(([label, val]) => (
                            <div key={label} className="flex items-center gap-2">
                              <span className="w-14 text-[9px] font-extrabold uppercase tracking-widest text-neutral">
                                {label}
                              </span>
                              <span className="text-xs font-semibold text-gray-700">
                                - ₹{Number(val).toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-neutral">—</span>
                      )}
                    </td>

                    {/* 7. Requested By — avatar + name + date */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar name={row.requestedBy} />
                        <div>
                          <p className="text-sm font-bold text-gray-800">
                            {row.requestedBy}
                          </p>
                          <p className="text-[10px] font-semibold text-neutral/70">
                            {formatDate(row.date)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 8. Actions */}
                    <td className="px-6 py-5 text-right pr-6">
                      <div className="flex items-center justify-end gap-4">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleReject(row.id)}
                              className="text-xs font-black uppercase tracking-widest text-[#F43F5E] hover:text-rose-700 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(row.id)}
                              className="rounded-xl bg-[#10B981] px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-[#059669] active:scale-[0.98]"
                            >
                              Authorize
                            </button>
                          </>
                        ) : (
                          <StatusPill status={row.status} />
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Count + Pagination ──────────────────────────────────────────────── */}
      {totalPages > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Showing {paginatedData.length} of {filteredData.length} requests
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-gray-100 px-7 py-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Approval Details
                </p>
                <h2 className="mt-1 text-xl font-black text-gray-900">
                  {selectedApproval.approvalId}
                </h2>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-7 py-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedApproval.requestedBy} />
                  <div>
                    <p className="text-[11px] text-gray-400">Requested by</p>
                    <p className="font-semibold text-gray-900">{selectedApproval.requestedBy}</p>
                  </div>
                </div>
                <StatusPill status={selectedApproval.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-gray-50 px-5 py-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Type</p>
                  <div className="mt-1.5"><TypePill type={selectedApproval.type} /></div>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Date</p>
                  <p className="mt-1.5 text-sm font-medium text-gray-700">{formatDate(selectedApproval.date)}</p>
                </div>
                {selectedApproval.amount != null && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Amount</p>
                    <p className="mt-1.5 text-sm font-bold text-success">
                      ₹{Number(selectedApproval.amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {selectedApproval.emiNumber != null && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">EMI #</p>
                    <p className="mt-1.5 text-sm font-medium text-gray-700">{selectedApproval.emiNumber}</p>
                  </div>
                )}
                <div className="col-span-1 sm:col-span-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Description</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{selectedApproval.description}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 px-7 py-5">
              {selectedApproval.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => { handleReject(selectedApproval.id); setSelectedApproval(null); }}
                    className="flex-1 rounded-full border border-danger/40 py-2.5 text-sm font-bold uppercase tracking-wide text-danger transition-colors hover:bg-danger/5"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { handleApprove(selectedApproval.id); setSelectedApproval(null); }}
                    className="flex-1 rounded-full bg-success py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-90"
                  >
                    Authorize
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}