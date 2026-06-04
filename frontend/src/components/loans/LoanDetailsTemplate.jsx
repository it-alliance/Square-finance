'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, User, Calendar, DollarSign, Phone, Car, MapPin,
  FileText, Shield, Hash, CreditCard, Clock, CheckCircle2, AlertTriangle, ChevronDown, Edit2
} from 'lucide-react';
import { mockLoans, mockEmiSchedule } from '@/mock/loans';
import { formatCurrency, formatDate } from '@/utils/formatting';
import StatusBadge from '@/components/common/StatusBadge';

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

/* ── Reusable detail field ────────────────────────────────── */
const DetailField = ({ label, value, highlight, phone, hasDropdown }) => (
  <div className="space-y-1.5 w-full">
    <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">{label}</p>
    <div className={`flex items-center justify-between rounded-xl border border-border-custom bg-background-custom p-3.5 px-4 text-sm font-bold text-text-primary shadow-3xs hover:border-primary/30 hover:bg-background-custom/80 transition-all ${
      highlight ? 'text-primary border-primary/20 bg-primary/5' : ''
    }`}>
      {phone && value ? (
        <a href={`tel:${value}`} className="hover:text-primary transition-colors hover:underline">{value}</a>
      ) : (
        <span>{value || 'N/A'}</span>
      )}
      {hasDropdown && <ChevronDown className="h-4 w-4 text-neutral shrink-0 ml-2" />}
    </div>
  </div>
);

/* ── Section card wrapper ─────────────────────────────────── */
const SectionCard = ({ title, subtitle, icon: Icon, iconBg, iconColor, children, className = '' }) => (
  <div className={`group/card rounded-2xl border border-border-custom bg-card-background shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden ${className}`}>
    <div className="flex items-center gap-3 border-b border-border-custom bg-background-custom/30 px-6 py-4 transition-colors group-hover/card:bg-background-custom/50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover/card:scale-105 ${iconBg} ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text-primary leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-text-secondary font-semibold tracking-tight mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function LoanDetailsTemplate({ loanType, loanId }) {
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

  // Calculated values
  const processingFee = ((loan.processingFeeRate || 0) / 100) * (loan.loanAmount || 0);
  const monthlyRate = (loan.interestRate || 0) / 100 / 12;
  const calculatedEMI = monthlyRate > 0 && loan.tenure > 0
    ? (loan.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loan.tenure)) /
      (Math.pow(1 + monthlyRate, loan.tenure) - 1)
    : 0;
  const totalRepayable = calculatedEMI * (loan.tenure || 0);
  const totalInterest = totalRepayable - (loan.loanAmount || 0);

  // Collect all mobile numbers
  const allMobiles = [
    loan.mobile,
    ...(loan.mobileNumbers || []).map(m => m.number).filter(n => n !== loan.mobile)
  ].filter(Boolean);

  const allGuarantorMobiles = [
    loan.primaryGuarantorMobile,
    ...(loan.guarantorMobileNumbers || []).map(m => m.number).filter(n => n !== loan.primaryGuarantorMobile)
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-8">
      {/* Sticky Header */}
      <div className="sticky top-[-24px] z-30 -mt-6 -mx-6 px-6 pt-6 pb-4 bg-white border-b border-border-custom shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Link
              href={routePrefix}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-text-secondary shadow-sm transition-all hover:bg-background-custom hover:text-text-primary border border-border-custom hover:scale-105 active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">Loan Profile View</h1>
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

        {/* Right side: Status badge and Edit button */}
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
          
          <Link
            href={`${routePrefix}/${loanId}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-custom bg-white px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-background-custom transition-all hover:scale-102 active:scale-98 shadow-3xs shrink-0"
          >
            <Edit2 className="h-3.5 w-3.5 text-neutral" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Page Metadata Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl bg-background-custom border border-border-custom p-3.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary shadow-2xs">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-neutral" />
          <span>Created by:</span>
          <span className="text-text-primary font-extrabold">{loan.createdBy || 'System Admin'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-neutral" />
          <span>Date Disbursed:</span>
          <span className="text-text-primary font-extrabold">{loan.dateLoanDisbursed ? formatDate(loan.dateLoanDisbursed) : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-neutral" />
          <span>Created At:</span>
          <span className="text-text-primary font-extrabold">{formatDateTime(loan.createdAt)}</span>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group rounded-2xl p-4.5 text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Loan Amount</p>
          <p className="text-2xl font-extrabold mt-1.5 tracking-tight">{formatCurrency(loan.loanAmount)}</p>
        </div>
        <div className="group rounded-2xl border border-border-custom bg-card-background p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Monthly EMI</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1.5 tracking-tight">{formatCurrency(loan.emiAmount || calculatedEMI)}</p>
        </div>
        <div className="group rounded-2xl border border-border-custom bg-card-background p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">EMI Due Date</p>
          <p className="text-2xl font-extrabold text-danger mt-1.5 tracking-tight">{formatDate(loan.dueDate)}</p>
        </div>
        <div className="group rounded-2xl border border-border-custom bg-card-background p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Status</p>
          <div className="mt-2"><StatusBadge status={loan.status} /></div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Customer & Guarantor Details"
            subtitle="Personal identity, contact info, and guarantor verification"
            icon={User}
            iconBg="bg-primary/10"
            iconColor="text-primary"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Customer Name" value={loan.customerName} />
              <DetailField label="Loan Number" value={loan.loanNumber} />
              <DetailField label="PAN Number" value={loan.panNumber} />
              <DetailField label="Aadhar Number" value={loan.aadharNumber} />
              <DetailField label="Ownership Type" value={loan.ownRent} hasDropdown />
              
              <div className="group flex flex-col gap-1.5 rounded-xl border border-border-custom bg-background-custom p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-background-custom sm:col-span-2 shadow-3xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Customer Mobile Number(s)</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allMobiles.map((num, i) => (
                    <a key={i} href={`tel:${num}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border-custom hover:border-primary/50 hover:text-primary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all shadow-2xs hover:scale-102">
                      <Phone className="h-3.5 w-3.5 text-neutral" /> {num}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-dashed border-border-custom">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Guarantor Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailField label="Guarantor Name" value={loan.guarantorName} />
                <DetailField label="Guarantor Aadhar" value={loan.guarantorAadhar} />
                
                <div className="group flex flex-col gap-1.5 rounded-xl border border-border-custom bg-background-custom p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-background-custom sm:col-span-2 shadow-3xs">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">Guarantor Mobile Number(s)</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {allGuarantorMobiles.length > 0 ? allGuarantorMobiles.map((num, i) => (
                      <a key={i} href={`tel:${num}`} className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border-custom hover:border-primary/50 hover:text-primary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all shadow-2xs hover:scale-102">
                        <Phone className="h-3.5 w-3.5 text-neutral" /> {num}
                      </a>
                    )) : <span className="text-xs font-semibold text-neutral italic">No guarantor mobiles registered</span>}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Vehicle Details"
            subtitle="Registration, model specifications, and dealership info"
            icon={Car}
            iconBg="bg-primary/10"
            iconColor="text-primary"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField label="Vehicle Number" value={loan.vehicleNumber} />
              <DetailField label="Make & Model" value={loan.makeModel} />
              <DetailField label="Model Year" value={loan.modelYear} />
              <DetailField label="Chassis Number" value={loan.chassisNumber} />
              <DetailField label="Engine Number" value={loan.engineNumber} />
              <DetailField label="Type of Vehicle" value={loan.typeOfVehicle} />
              <DetailField label="Board Type" value={loan.boardType === 'Yellow' ? 'Yellow (Commercial)' : 'White (Private)'} hasDropdown />
              <DetailField label="HP Entry" value={loan.hpEntry} hasDropdown />
              
              <div className="space-y-1.5 w-full">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral">RTO Work Pending</p>
                <div className="flex flex-wrap gap-1.5 p-1">
                  {loan.rtoPending && loan.rtoPending.length > 0 ? (
                    loan.rtoPending.map((task, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-3xs uppercase tracking-wide">
                        {task}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs font-semibold text-neutral italic">No tasks pending</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-dashed border-border-custom">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Dealer & Registration Timings</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Dealer Name" value={loan.dealerName} />
                <DetailField label="Dealer Contact" value={loan.dealerNumber} phone />
                <div className="hidden lg:block"></div>
                <DetailField label="FC Date" value={loan.fcDate ? formatDate(loan.fcDate) : 'N/A'} />
                <DetailField label="Insurance Date" value={loan.insuranceDate ? formatDate(loan.insuranceDate) : 'N/A'} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Loan Terms"
            subtitle="Principal, interest rates, and processing rates"
            icon={DollarSign}
            iconBg="bg-[var(--color-success-bg)]"
            iconColor="text-success"
          >
            <div className="space-y-4">
              <DetailField label="Total Principal" value={formatCurrency(loan.loanAmount)} highlight />
              <DetailField label="Interest Rate" value={`${loan.interestRate ?? 'N/A'}%`} />
              <DetailField label="Tenure" value={`${loan.tenure || 'N/A'} Months`} />
              <DetailField label="Processing Fee Rate" value={`${loan.processingFeeRate ?? 'N/A'}%`} />
              <DetailField label="Processing Fee" value={formatCurrency(processingFee)} />
              <DetailField label="Monthly EMI" value={formatCurrency(loan.emiAmount || calculatedEMI)} highlight />
            </div>
          </SectionCard>

          <SectionCard
            title="Addresses"
            subtitle="Registered primary locations"
            icon={MapPin}
            iconBg="bg-[var(--color-warning-bg)]"
            iconColor="text-warning"
          >
            <div className="space-y-4">
              <DetailField label="Customer Address" value={loan.currentAddress || loan.customerAddress} />
              <DetailField label="Customer Pincode" value={loan.customerPincode} />
              <DetailField label="Guarantor Address" value={loan.guarantorAddress} />
              <DetailField label="Guarantor Pincode" value={loan.guarantorPincode} />
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-accent bg-secondary text-white shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-accent bg-accent/40 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Remarks & RTO</h2>
                <p className="text-[11px] text-white/70 font-semibold mt-0.5">Admin notes and pending tasks</p>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">Pending RTO Tasks</p>
                {loan.rtoPending && loan.rtoPending.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {loan.rtoPending.map((task, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-md bg-accent border border-accent px-2.5 py-1 text-xs font-bold text-warning shadow-2xs">
                        <AlertTriangle className="h-3 w-3" /> {task}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-white/60 italic">No pending RTO tasks</p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">Remarks</p>
                <div className="rounded-xl bg-accent/50 border border-accent p-3.5 text-xs text-white/95 font-medium leading-relaxed">
                  {loan.remarks || 'No remarks available.'}
                </div>
                {loan.followUpDate && (
                  <div className="mt-3.5 flex items-center gap-2 text-xs font-bold text-warning">
                    <Calendar className="h-3.5 w-3.5" /> Follow-up Date: <span className="text-white font-extrabold">{formatDate(loan.followUpDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Ledger & Timeline */}
      <SectionCard
        title="Financial Ledger & Timeline"
        subtitle="Repayment lifecycle, milestones, and total calculations"
        icon={DollarSign}
        iconBg="bg-primary/10"
        iconColor="text-primary"
      >
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Date Disbursed</p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">{loan.dateLoanDisbursed ? formatDate(loan.dateLoanDisbursed) : 'N/A'}</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-success-bg)] text-success shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">EMI Start Date</p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">{loan.emiStartDate ? formatDate(loan.emiStartDate) : 'N/A'}</p>
              </div>
            </div>
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">EMI End Date</p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">{loan.emiEndDate ? formatDate(loan.emiEndDate) : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 pt-5 border-t border-border-custom">
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Total Principal</p>
              <p className="text-lg font-extrabold text-text-primary mt-2">{formatCurrency(loan.loanAmount)}</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Total Interest</p>
              <p className="text-lg font-extrabold text-primary mt-2">+{formatCurrency(totalInterest)}</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Monthly EMI</p>
              <p className="text-lg font-extrabold text-text-primary mt-2">{formatCurrency(loan.emiAmount || calculatedEMI)}</p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">Total Repayable</p>
              <p className="text-lg font-extrabold text-text-primary mt-2">{formatCurrency(totalRepayable)}</p>
            </div>
          </div>
        </div>
      </SectionCard>

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

      {/* Back to List */}
      <div className="flex justify-start pt-2">
        <Link
          href={routePrefix}
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-secondary active:bg-accent text-white shadow-sm transition-all hover:shadow px-6 py-3 text-sm font-bold active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to List
        </Link>
      </div>
    </div>
  );
}
