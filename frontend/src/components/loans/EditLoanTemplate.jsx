'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, DollarSign } from 'lucide-react';
import CreateLoanForm from '@/components/forms/CreateLoanForm';
import { mockLoans, mockEmiSchedule } from '@/mock/loans';
import { formatCurrency, formatDate } from '@/utils/formatting';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

export default function EditLoanTemplate({ loanType, loanId }) {
  const loan = useMemo(() => mockLoans.find((l) => l.id === loanId), [loanId]);

  if (!loan) {
    notFound();
  }

  const routePrefix = `/${loanType.toLowerCase()}-loans`;

  // EMI schedule for this loan
  let schedule = mockEmiSchedule.filter(s => s.loanId === loanId);
  if (schedule.length === 0) {
    schedule = mockEmiSchedule;
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Sticky Header */}
      <div className="sticky top-[-24px] z-30 -mt-6 -mx-6 px-6 pt-6 pb-4 bg-white border-b border-border-custom shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href={`${routePrefix}/${loanId}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-text-secondary shadow-sm transition-all hover:bg-background-custom hover:text-text-primary border border-border-custom hover:scale-105 active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">Edit Loan Profile</h1>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-text-secondary uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-extrabold">Loan Number</span>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-black text-primary">
                {loan.loanNumber}
              </span>
            </div>
            <span className="text-neutral/50">|</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-extrabold">Vehicle Number</span>
              <span className="rounded-md border border-border-custom bg-background-custom px-2.5 py-1 text-[11px] font-black text-text-primary">
                {loan.vehicleNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Status badge */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border shadow-3xs ${
            loan.status === 'Active' ? 'bg-[var(--color-success-bg)] text-success border-[var(--color-success)]/10' :
            loan.status === 'Overdue' ? 'bg-[#FEE2E2] text-danger border-[var(--color-danger)]/10' :
            'bg-[#F3F4F6] text-text-secondary border-border-custom'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              loan.status === 'Active' ? 'bg-success' :
              loan.status === 'Overdue' ? 'bg-danger' :
              'bg-text-secondary'
            }`} />
            {loan.status}
          </span>
        </div>
      </div>

      <CreateLoanForm loan={loan} defaultLoanType={loanType} />

      {/* EMI Payment Schedule Table */}
      <div className="rounded-2xl border border-border-custom bg-card-background shadow-sm overflow-hidden mt-2">
        <div className="border-b border-border-custom bg-background-custom/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">EMI Payment Schedule</h2>
              <p className="text-[11px] font-semibold text-text-secondary mt-0.5">Track and manage individual EMI payments</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="bg-background-custom text-[10px] uppercase text-primary border-b border-border-custom">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">No.</th>
                <th className="px-6 py-4 font-bold tracking-wider">Due Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">EMI Amount</th>
                <th className="px-6 py-4 font-bold tracking-wider">Amount Paid</th>
                <th className="px-6 py-4 font-bold tracking-wider">Payment Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">Mode</th>
                <th className="px-6 py-4 font-bold tracking-wider text-danger">Overdue</th>
                <th className="px-6 py-4 font-bold tracking-wider">Payment</th>
                <th className="px-6 py-4 font-bold tracking-wider">Remarks</th>
                <th className="px-6 py-4 font-bold tracking-wider">Approved By</th>
                <th className="px-6 py-4 font-bold tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom bg-card-background">
              {schedule.length > 0 ? (
                schedule.map((item, index) => {
                  const isPaid = item.paymentStatus === 'Paid';
                  return (
                    <tr key={item.id} className="hover:bg-background-custom transition-colors duration-150">
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">{index + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-text-secondary">{formatDate(item.dueDate)}</td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">{formatCurrency(item.emiAmount)}</td>
                      <td className={`whitespace-nowrap px-6 py-4 font-bold ${isPaid ? 'text-success' : 'text-text-secondary/50'}`}>
                        {item.amountPaid > 0 ? formatCurrency(item.amountPaid) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {item.paymentDate !== '-' ? formatDate(item.paymentDate) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {item.mode !== '-' ? (
                          <span className="inline-flex rounded-md bg-background-custom border border-border-custom px-2 py-0.5 text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">
                            {item.mode}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-danger">
                        {item.overdue > 0 ? formatCurrency(item.overdue) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wider uppercase shadow-3xs ${
                          isPaid ? 'bg-[var(--color-success-bg)] text-success border border-[var(--color-success)]/10' : 'bg-[var(--color-warning-bg)] text-warning border border-[var(--color-warning)]/10'
                        }`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-text-secondary max-w-[200px] truncate" title={item.remarks}>
                        {item.remarks}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-text-primary">{item.approvedBy}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {item.lastUpdated !== '-' ? formatDateTime(item.lastUpdated) : '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-text-secondary font-medium italic">
                    No payment schedule found for this loan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
