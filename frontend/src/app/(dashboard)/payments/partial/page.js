'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { mockPartialPayments } from '@/mock/payments';
import SearchInput from '@/components/common/SearchInput';
import Pagination from '@/components/tables/Pagination';
import { formatCurrency, formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE } from '@/utils/constants';
import { Eye, Truck, Check, X, MoreVertical } from 'lucide-react';

// Reusable dropdown menu
function ActionMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-custom bg-white text-text-secondary hover:bg-gray-50 hover:text-text-primary transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-border-custom bg-white shadow-lg overflow-hidden">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { item.onClick(); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50 ${item.danger ? 'text-[var(--color-danger)]' : 'text-text-primary'}`}
            >
              <item.icon className={`h-3.5 w-3.5 shrink-0 ${item.danger ? 'text-[var(--color-danger)]' : 'text-text-secondary'}`} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartialPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewPayment, setViewPayment] = useState(null);
  const [seizePayment, setSeizePayment] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter data
  const filteredData = useMemo(() => {
    return searchFilter(mockPartialPayments, searchTerm, [
      'loanId',
      'applicantName',
      'applicantMobile',
      'vehicleNumber',
    ]);
  }, [searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredData, currentPage]);

  const handleSeizeConfirm = () => {
    if (!seizePayment) return;
    setSuccessMessage(`Vehicle ${seizePayment.vehicleNumber} seizure order raised for Loan ID ${seizePayment.loanId}.`);
    setSeizePayment(null);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-500 hover:text-emerald-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl bg-white border border-border-custom p-4 shadow-sm">
        <SearchInput
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search partial payments..."
        />
        <span className="text-sm text-text-secondary">
          Showing {paginatedData.length} of {filteredData.length} records
        </span>
      </div>

      {/* Table */}
      <div className="bg-card-background border border-border-custom rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-border-custom bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-semibold text-text-secondary">Loan ID</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">Applicant Name</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">Applicant Mobile</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">Vehicle Number</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">Disbursement</th>
                <th className="px-6 py-4 font-semibold text-text-secondary">Customer Response</th>
                <th className="px-6 py-4 font-semibold text-text-secondary text-center">Months</th>
                <th className="px-6 py-4 font-semibold text-text-secondary text-right">Remaining Amount</th>
                <th className="px-6 py-4 font-semibold text-text-secondary text-center">Days</th>
                <th className="px-6 py-4 font-semibold text-text-secondary text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-primary whitespace-nowrap">{item.loanId}</td>
                    <td className="px-6 py-4 font-medium text-text-primary">{item.applicantName}</td>
                    <td className="px-6 py-4 text-text-secondary">{item.applicantMobile}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex whitespace-nowrap rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800 border border-gray-200 uppercase font-mono tracking-wider">
                        {item.vehicleNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{formatDate(item.disbursement)}</td>
                    <td className="px-6 py-4 text-text-secondary italic max-w-xs truncate" title={item.customerResponse}>
                      {item.customerResponse || '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-text-primary">{item.months}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[var(--color-info)]">{formatCurrency(item.remainingAmount)}</td>
                    <td className="px-6 py-4 text-center font-semibold text-text-primary">{item.days}</td>
                    <td className="px-6 py-4 text-center">
                      <ActionMenu
                        items={[
                          { label: 'View Details', icon: Eye, onClick: () => setViewPayment(item) },
                          { label: 'Seize Vehicle', icon: Truck, danger: true, onClick: () => setSeizePayment(item) },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-text-secondary">
                    No partial payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        )}
      </div>

      {/* View Details Modal */}
      {viewPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-border-custom animate-scale-in">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-text-primary">Loan Details</h3>
              </div>
              <button onClick={() => setViewPayment(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {[
                ['Loan ID', viewPayment.loanId, 'font-mono text-primary font-semibold'],
                ['Applicant Name', viewPayment.applicantName, 'font-semibold text-text-primary'],
                ['Mobile', viewPayment.applicantMobile, 'text-text-secondary'],
                ['Vehicle Number', viewPayment.vehicleNumber, 'font-mono uppercase text-text-primary'],
                ['Disbursement Date', formatDate(viewPayment.disbursement), 'text-text-secondary'],
                ['Loan Months', viewPayment.months, 'text-text-primary'],
                ['Remaining Balance', formatCurrency(viewPayment.remainingAmount), 'font-semibold text-[var(--color-info)]'],
                ['Days Overdue', viewPayment.days, 'font-semibold text-[var(--color-warning)]'],
                ['Customer Response', viewPayment.customerResponse || '—', 'italic text-text-secondary'],
              ].map(([label, value, cls]) => (
                <div key={label} className="flex justify-between items-center rounded-lg bg-gray-50 px-3 py-2 border border-border-custom">
                  <span className="text-text-secondary">{label}:</span>
                  <span className={cls}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 mt-2 border-t border-border-custom">
              <button onClick={() => setViewPayment(null)} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-secondary transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seize Vehicle Modal */}
      {seizePayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-border-custom animate-scale-in">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[var(--color-danger)]" />
                <h3 className="text-lg font-bold text-text-primary">Seize Vehicle</h3>
              </div>
              <button onClick={() => setSeizePayment(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-text-secondary">Applicant:</span><span className="font-semibold text-text-primary">{seizePayment.applicantName}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Loan ID:</span><span className="font-mono font-semibold text-primary">{seizePayment.loanId}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Vehicle:</span><span className="font-mono font-semibold uppercase text-text-primary">{seizePayment.vehicleNumber}</span></div>
              </div>
              <p className="text-xs text-text-secondary">
                Are you sure you want to raise a <strong className="text-[var(--color-danger)]">vehicle seizure order</strong>? This action will be logged.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-4 mt-2 border-t border-border-custom">
              <button onClick={() => setSeizePayment(null)} className="rounded-lg border border-border-custom bg-white px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSeizeConfirm} className="rounded-lg bg-[var(--color-danger)] px-4 py-2 text-xs font-bold text-white hover:opacity-90 hover:shadow transition-all">Confirm Seizure</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
