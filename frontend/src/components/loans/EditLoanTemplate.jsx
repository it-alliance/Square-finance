'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, DollarSign, X } from 'lucide-react';
import CreateLoanForm from '@/components/forms/CreateLoanForm';
import { formatCurrency, formatDate } from '@/utils/formatting';
import { generateEmiSchedule } from '@/utils/generateEmiSchedule';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/utils/apiClient';
import { mockMonthlyLoans } from '@/mock/monthlyLoans';

const formatDateTime = (dateStr) => {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

/* ─── helper to create a blank payment entry ─── */
const blankPayment = () => ({
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMode: 'Cash',
  amount: '',
});

/* ─── helper to create a blank overdue entry ─── */
const blankOverdue = () => ({
  overdueDate: new Date().toISOString().split('T')[0],
  paymentMode: 'Cash',
  amount: '',
});

/* ─── immutable array updater ─── */
const updateAt = (arr, index, key, value) =>
  arr.map((item, i) => (i === index ? { ...item, [key]: value } : item));

const removeAt = (arr, index) => arr.filter((_, i) => i !== index);

/* ─── Payment Mode Options ─── */
const PAYMENT_MODES = ['Cash', 'Online', 'Cheque'];

/* ─── Map raw data → form-ready object ─── */
const mapLoan = (d) => ({
  id: d._id || d.id,
  loanType: d.loanType || 'Monthly',
  loanNumber: d.loanTerms?.loanNumber || d.loanNumber,
  status: d.status?.status || d.status,
  createdAt: d.status?.createdAt || d.createdAt,
  dateLoanDisbursed: (d.loanTerms?.dateLoanDisbursed || d.dateLoanDisbursed)
    ? new Date(d.loanTerms?.dateLoanDisbursed || d.dateLoanDisbursed).toISOString().split('T')[0] : '',
  emiStartDate: (d.loanTerms?.emiStartDate || d.emiStartDate)
    ? new Date(d.loanTerms?.emiStartDate || d.emiStartDate).toISOString().split('T')[0] : '',
  emiEndDate: (d.loanTerms?.emiEndDate || d.emiEndDate)
    ? new Date(d.loanTerms?.emiEndDate || d.emiEndDate).toISOString().split('T')[0] : '',
  loanAmount: d.loanTerms?.principalAmount ?? d.totalPrincipalAmount ?? d.loanAmount,
  totalPrincipalAmount: d.loanTerms?.principalAmount ?? d.totalPrincipalAmount ?? d.loanAmount,
  interestRate: d.loanTerms?.annualInterestRate ?? d.interestRate,
  tenure: d.loanTerms?.tenureMonths ?? d.tenure,
  processingFeeRate: d.loanTerms?.processingFeeRate ?? d.processingFeeRate,
  emiAmount: (() => {
    const type = d.loanType || 'Monthly';
    const principal = d.loanTerms?.principalAmount ?? d.totalPrincipalAmount ?? d.loanAmount ?? 0;
    const rate = d.loanTerms?.annualInterestRate ?? d.interestRate ?? 0;
    const tenureVal = d.loanTerms?.tenureMonths ?? d.tenure ?? 1;

    if (type === 'Daily' || type === 'Weekly' || type === 'Monthly') {
      const interestAmountPerPeriod = principal * (rate / 100);
      const totalInterest = tenureVal * interestAmountPerPeriod;
      return Math.ceil((principal + totalInterest) / tenureVal);
    }
    return d.loanTerms?.monthlyEMI ?? d.emiAmount;
  })(),
  dueDate: d.loanTerms?.emiStartDate ?? d.dueDate,

  customerName: d.customerDetails?.customerName || d.customer?.name || d.customerName,
  panNumber: d.customerDetails?.panNumber || d.customer?.panNumber || d.panNumber,
  aadharNumber: d.customerDetails?.aadharNumber || d.customer?.aadharNumber || d.aadharNumber,
  ownRent: d.customerDetails?.ownRent || d.customer?.ownershipType || d.customer?.ownRent || d.ownRent,
  mobile: d.customerDetails?.mobileNumbers?.[0] || d.customer?.primaryMobile || d.mobile,
  primaryMobileNumber: d.customerDetails?.mobileNumbers?.[0] || d.customer?.primaryMobile || d.mobile,
  mobileNumbers: (d.customerDetails?.mobileNumbers || []).map(n => ({ number: n })).concat(d.customer?.mobileNumbers?.map?.(n =>
    typeof n === 'string' ? { number: n } : n
  ) || d.mobileNumbers || []),
  currentAddress: d.customerDetails?.address || d.customer?.currentAddress || d.currentAddress || d.customerAddress,
  customerAddress: d.customerDetails?.address || d.customer?.currentAddress || d.customerAddress,
  customerPincode: d.customer?.pincode || d.customerPincode,

  guarantorName: d.customerDetails?.guarantorName || d.customer?.guarantorName || d.guarantorName,
  guarantorAadhar: d.customer?.guarantorAadhar || d.guarantorAadhar,
  primaryGuarantorMobile: d.customerDetails?.guarantorMobileNumbers?.[0] || d.customer?.primaryGuarantorMobile || d.customer?.guarantorMobile || d.primaryGuarantorMobile,
  guarantorMobileNumbers: (d.customerDetails?.guarantorMobileNumbers || []).map(n => ({ number: n })).concat(d.customer?.guarantorMobileNumbers?.map?.(n =>
    typeof n === 'string' ? { number: n } : n
  ) || d.guarantorMobileNumbers || []),
  guarantorAddress: d.customer?.guarantorAddress || d.guarantorAddress,
  guarantorPincode: d.customer?.guarantorPincode || d.guarantorPincode,

  vehicleNumber: d.vehicleInformation?.vehicleNumber || d.vehicleNumber,
  makeModel: d.vehicleInformation?.typeOfVehicle || d.typeOfVehicle || d.makeModel,
  modelYear: d.vehicleInformation?.modelYear || d.modelYear,
  chassisNumber: d.vehicleInformation?.chassisNumber || d.chassisNumber,
  engineNumber: d.vehicleInformation?.engineNumber || d.engineNumber,
  typeOfVehicle: d.vehicleInformation?.typeOfVehicle || d.typeOfVehicle,
  boardType: d.vehicleInformation?.ywBoard || d.boardType,
  hpEntry: d.vehicleInformation?.hpEntry || d.hpEntry,
  rtoPending: d.vehicleInformation?.rtoWorkPending || d.rtoPending || [],
  dealerName: d.vehicleInformation?.dealerName || d.dealerName,
  dealerNumber: d.vehicleInformation?.dealerNumber || d.dealerNumber,
  fcDate: (d.vehicleInformation?.fcDate || d.fcDate) ? new Date(d.vehicleInformation?.fcDate || d.fcDate).toISOString().split('T')[0] : '',
  insuranceDate: (d.vehicleInformation?.insuranceDate || d.insuranceDate) ? new Date(d.vehicleInformation?.insuranceDate || d.insuranceDate).toISOString().split('T')[0] : '',

  remarks: d.status?.remarks || d.followUps?.[0]?.employeeComment || d.remarks || '',
  followUpDate: (d.status?.nextFollowUpDate || d.followUps?.[0]?.promisedDate || d.followUpDate)
    ? new Date(d.status?.nextFollowUpDate || d.followUps?.[0]?.promisedDate || d.followUpDate).toISOString().split('T')[0]
    : '',
});

export default function EditLoanTemplate({ loanType, loanId }) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setLoading(true);
        setError(null);

        // Direct GET /api/monthly-loans/:id call to the backend
        const endpoint = `/${loanType.toLowerCase()}-loans/${loanId}`;
        const res = await apiClient.get(endpoint);
        if (res.status === 'success' || res.success) {
          const loanData = res.data || res;
          setLoan(mapLoan(loanData));
          setLoading(false);
          return;
        }

        throw new Error('Loan not found. Please go back and try again.');
      } catch (err) {
        // Fallback: fetch list and find by ID
        try {
          const listEndpoint = `/${loanType.toLowerCase()}-loans?limit=1000&page=1`;
          const listRes = await apiClient.get(listEndpoint);
          if (listRes.status === 'success' || listRes.success) {
            const loansArray = listRes.data?.data || listRes.data || [];
            const found = loansArray.find(l => (l._id || l.id) === loanId);
            if (found) {
              setLoan(mapLoan(found));
              setLoading(false);
              return;
            }
          }
        } catch (fallbackErr) { /* ignore */ }
        setError(err.message || 'Failed to load loan');
      } finally {
        setLoading(false);
      }
    };
    fetchLoan();
  }, [loanId, loanType]);

  const routePrefix = `/${loanType.toLowerCase()}-loans`;
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState(null);

  /* ─── EMI schedule state ─── */
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    if (loan) {
      setSchedule(
        generateEmiSchedule(
          loan.loanAmount,
          loan.tenure,
          loan.emiStartDate,
          loan.id,
          loan.loanType || loanType,
          loan.interestRate
        )
      );
    }
  }, [loan, loanType]);

  /* ─── Modal form state ─── */
  const [modalPayments, setModalPayments] = useState([]);
  const [modalOverdues, setModalOverdues] = useState([]);
  const [modalRemarks, setModalRemarks] = useState('');

  /* ─── Open modal ─── */
  const handleEditClick = (emi) => {
    setSelectedEmi(emi);
    setModalPayments(emi.payments?.length ? emi.payments : [blankPayment()]);
    setModalOverdues(emi.overdues || []);
    setModalRemarks(emi.remarks || '');
    setShowEmiModal(true);
  };

  /* ─── Auto calculations ─── */
  const totalPaid = useMemo(
    () => modalPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [modalPayments]
  );

  const remainingAmount = useMemo(
    () => (selectedEmi ? Math.max(0, selectedEmi.emiAmount - totalPaid) : 0),
    [totalPaid, selectedEmi]
  );

  const calculatedStatus = useMemo(() => {
    if (!selectedEmi) return 'Pending';
    if (totalPaid === 0) return 'Pending';
    if (totalPaid < selectedEmi.emiAmount) return 'Partial';
    return 'Paid';
  }, [totalPaid, selectedEmi]);

  /* ─── Save handler ─── */
  const handleUpdateEmi = () => {
    if (!selectedEmi) return;
    setSchedule((prev) =>
      prev.map((item) =>
        item.id === selectedEmi.id
          ? {
              ...item,
              payments: modalPayments,
              overdues: modalOverdues,
              totalPaid,
              remainingAmount,
              paymentStatus: calculatedStatus,
              remarks: modalRemarks,
              lastUpdated: new Date().toISOString(),
              approvedBy: user?.name || user?.username || 'Super Admin',
            }
          : item
      )
    );
    setShowEmiModal(false);
    setSelectedEmi(null);
  };

  /* ─── Status badge colours ─── */
  const statusStyle = {
    Paid: 'bg-[var(--color-success-bg)] text-success border-[var(--color-success)]/20',
    Partial: 'bg-primary/10 text-primary border-primary/20',
    Pending: 'bg-[var(--color-warning-bg)] text-warning border-[var(--color-warning)]/20',
  };

  const modalStatusStyle = {
    Paid: 'bg-[var(--color-success-bg)] text-success border-[var(--color-success)]/20',
    Partial: 'bg-primary/10 text-primary border-primary/20',
    Pending: 'bg-danger/5 text-danger border-danger/20',
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
          <X className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-text-primary mb-2">Failed to load loan profile</h2>
        <p className="text-sm text-text-secondary mb-6">{error || 'Loan not found'}</p>
        <Link href={routePrefix} className="rounded-lg bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-secondary">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─── */}
      <div className="sticky top-[-12px] sm:top-[-16px] md:top-[-24px] z-30 -mt-3 sm:-mt-4 md:-mt-6 -mx-3 sm:-mx-4 md:-mx-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 bg-white border-b border-border-custom shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href={`${routePrefix}/${loanId}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-text-secondary shadow-sm transition-all hover:bg-background-custom hover:text-text-primary border border-border-custom hover:scale-105 active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">
              Edit Loan Profile
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-text-secondary uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-extrabold">Loan No.</span>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                {loan.loanNumber}
              </span>
            </div>
            <span className="text-neutral/50 hidden sm:inline">|</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-extrabold">Vehicle</span>
              <span className="rounded-md border border-border-custom bg-background-custom px-2 py-1 text-[11px] font-black text-text-primary">
                {loan.vehicleNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border shadow-3xs ${
              loan.status === 'Active'
                ? 'bg-[var(--color-success-bg)] text-success border-[var(--color-success)]/10'
                : loan.status === 'Overdue'
                ? 'bg-[#FEE2E2] text-danger border-[var(--color-danger)]/10'
                : 'bg-[#F3F4F6] text-text-secondary border-border-custom'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loan.status === 'Active'
                  ? 'bg-success'
                  : loan.status === 'Overdue'
                  ? 'bg-danger'
                  : 'bg-text-secondary'
              }`}
            />
            {loan.status}
          </span>
        </div>
      </div>

      <CreateLoanForm loan={loan} defaultLoanType={loanType} />

      {/* ─── EMI Payment Schedule Table ─── */}
      <div className="rounded-2xl border border-border-custom bg-card-background shadow-sm overflow-hidden mt-2">
        <div className="border-b border-border-custom bg-background-custom/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">EMI Payment Schedule</h2>
              <p className="text-[11px] font-semibold text-text-secondary mt-0.5">
                Track and manage individual EMI payments
              </p>
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
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider">Remarks</th>
                <th className="px-6 py-4 font-bold tracking-wider">Approved By</th>
                <th className="px-6 py-4 font-bold tracking-wider">Last Updated</th>
                <th className="px-6 py-4 font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom bg-card-background">
              {schedule.length > 0 ? (
                schedule.map((item, index) => {
                  const isPaid = item.paymentStatus === 'Paid';
                  const lastPayment = item.payments?.[item.payments.length - 1];
                  const totalOverdue = item.overdues?.reduce((s, o) => s + Number(o.amount || 0), 0) ?? 0;

                  return (
                    <tr key={item.id} className="hover:bg-background-custom transition-colors duration-150">
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">{index + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-text-secondary">
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">
                        {formatCurrency(item.emiAmount)}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-4 font-bold ${isPaid ? 'text-success' : 'text-text-secondary/50'}`}>
                        {item.totalPaid > 0 ? formatCurrency(item.totalPaid) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {lastPayment?.paymentDate ? formatDate(lastPayment.paymentDate) : '-'}
                        {item.payments?.length > 1 && (
                          <span className="ml-1 text-[9px] text-primary font-bold">(+{item.payments.length - 1})</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {lastPayment?.paymentMode ? (
                          <span className="inline-flex rounded-md bg-background-custom border border-border-custom px-2 py-0.5 text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">
                            {lastPayment.paymentMode}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-danger">
                        {totalOverdue > 0 ? formatCurrency(totalOverdue) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wider uppercase shadow-3xs border ${statusStyle[item.paymentStatus] || statusStyle.Pending}`}>
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-text-secondary max-w-[200px] truncate" title={item.remarks}>
                        {item.remarks || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-text-primary">{item.approvedBy}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {formatDateTime(item.lastUpdated)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-secondary transition-colors"
                        >
                          EDIT
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className="px-6 py-12 text-center text-text-secondary font-medium italic">
                    No payment schedule found for this loan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EMI UPDATE MODAL — rendered at page level
      ═══════════════════════════════════════════════════════════════ */}
      {showEmiModal && selectedEmi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-[460px] rounded-2xl bg-white shadow-2xl flex flex-col"
            style={{ maxHeight: '92vh' }}
          >
            {/* ── Modal Header ── */}
            <div className="px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-text-primary tracking-tight">
                    UPDATE EMI #{selectedEmi.emiNumber}
                  </h2>
                  <p className="mt-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    Due Date: {formatDate(selectedEmi.dueDate)}&nbsp;&nbsp;|&nbsp;&nbsp;Amount: {formatCurrency(selectedEmi.emiAmount)}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmiModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border-custom text-text-secondary hover:text-text-primary hover:bg-background-custom transition-colors shrink-0 mt-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* ── Modal Body (scrollable) ── */}
            <div className="overflow-y-auto px-5 pb-2 flex-1 space-y-3.5">

              {/* Remaining Amount */}
              <div className="rounded-xl border border-border-custom bg-background-custom/30 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                  Remaining Amount
                </p>
                <p className="mt-0.5 text-2xl font-black text-text-primary">
                  {formatCurrency(remainingAmount)}
                </p>
              </div>

              {/* ── Payment Card ── */}
              <div className="rounded-xl border border-border-custom overflow-hidden">
                {/* Payment rows */}
                {modalPayments.map((payment, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-3 space-y-2.5 ${idx > 0 ? 'border-t border-border-custom' : ''}`}
                  >
                    {/* Row header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                        Payment Date
                      </span>
                      <button
                        onClick={() => {
                          const next = removeAt(modalPayments, idx);
                          setModalPayments(next.length ? next : [blankPayment()]);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-danger hover:opacity-70 transition-opacity"
                      >
                        Clear
                      </button>
                    </div>

                    {/* Date picker */}
                    <input
                      type="date"
                      value={payment.paymentDate}
                      onChange={(e) =>
                        setModalPayments(updateAt(modalPayments, idx, 'paymentDate', e.target.value))
                      }
                      className="w-full rounded-xl border border-border-custom px-3 py-2 text-xs font-semibold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    {/* Mode + Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-text-secondary">
                          Payment Mode
                        </label>
                        <div className="relative">
                          <select
                            value={payment.paymentMode}
                            onChange={(e) =>
                              setModalPayments(updateAt(modalPayments, idx, 'paymentMode', e.target.value))
                            }
                            className="w-full appearance-none rounded-xl border border-border-custom px-3 py-2 pr-7 text-xs font-semibold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            {PAYMENT_MODES.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-[10px]">▼</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-text-secondary">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={payment.amount}
                          onChange={(e) =>
                            setModalPayments(
                              updateAt(modalPayments, idx, 'amount', e.target.value === '' ? '' : Number(e.target.value))
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-border-custom px-3 py-2 text-xs font-bold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add More — inside the card */}
                <div className="px-4 py-2.5 border-t border-border-custom bg-background-custom/20">
                  <button
                    onClick={() => setModalPayments([...modalPayments, blankPayment()])}
                    className="text-[10px] font-black text-primary uppercase tracking-wider hover:opacity-70 transition-opacity"
                  >
                    + Add More
                  </button>
                </div>
              </div>

              {/* ── Overdue Section ── */}
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                  OVERDUE
                </p>
                {modalOverdues.length === 0 ? (
                  /* Empty state — dashed add button */
                  <button
                    onClick={() => setModalOverdues([blankOverdue()])}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-border-custom text-xs font-black text-text-secondary uppercase tracking-widest hover:text-text-primary hover:bg-background-custom/30 transition-colors"
                  >
                    + Add Date
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    {modalOverdues.map((overdue, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-border-custom bg-white px-4 py-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                            OVERDUE DATE
                          </span>
                          <button
                            onClick={() => setModalOverdues(removeAt(modalOverdues, idx))}
                            className="text-[9px] font-black uppercase tracking-widest text-danger hover:opacity-70 transition-opacity font-extrabold"
                          >
                            CLEAR
                          </button>
                        </div>
                        <input
                          type="date"
                          value={overdue.overdueDate}
                          onChange={(e) =>
                            setModalOverdues(updateAt(modalOverdues, idx, 'overdueDate', e.target.value))
                          }
                          className="w-full rounded-xl border border-border-custom px-3 py-2 text-xs font-semibold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-text-secondary">
                              PAYMENT MODE
                            </label>
                            <div className="relative">
                              <select
                                value={overdue.paymentMode}
                                onChange={(e) =>
                                  setModalOverdues(updateAt(modalOverdues, idx, 'paymentMode', e.target.value))
                                }
                                className="w-full appearance-none rounded-xl border border-border-custom px-3 py-2 pr-7 text-xs font-semibold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20"
                              >
                                {PAYMENT_MODES.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary text-[10px]">▼</span>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-[9px] font-black uppercase tracking-widest text-text-secondary">
                              AMOUNT
                            </label>
                            <input
                              type="number"
                              value={overdue.amount}
                              onChange={(e) =>
                                setModalOverdues(
                                  updateAt(modalOverdues, idx, 'amount', e.target.value === '' ? '' : Number(e.target.value))
                                )
                              }
                              placeholder="0"
                              className="w-full rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-bold text-danger outline-none focus:ring-2 focus:ring-danger/20"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add More overdue — separate dashed button */}
                    <button
                      onClick={() => setModalOverdues([...modalOverdues, blankOverdue()])}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-danger/25 bg-danger/5 text-xs font-black text-danger uppercase tracking-widest hover:bg-danger/10 transition-colors flex items-center justify-center"
                    >
                      + ADD MORE
                    </button>
                  </div>
                )}
              </div>

              {/* ── Payment Status Badge ── */}
              <div>
                <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-text-secondary">
                  PAYMENT STATUS
                </p>
                <div
                  className={`w-full rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-widest ${modalStatusStyle[calculatedStatus] || modalStatusStyle.Pending}`}
                >
                  {calculatedStatus}
                </div>
              </div>

              {/* ── Remarks ── */}
              <div>
                <label className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-text-secondary">
                  REMARK
                </label>
                <textarea
                  rows={2}
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full rounded-xl border border-border-custom px-3 py-2 text-xs font-semibold text-text-primary bg-white outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* bottom breathing room */}
              <div className="h-1" />
            </div>

            {/* ── Modal Footer ── */}
            <div className="px-5 py-3 border-t border-border-custom flex items-center justify-between gap-3 shrink-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowEmiModal(false)}
                className="flex-1 rounded-full border border-border-custom py-2.5 text-xs font-black text-text-secondary bg-white hover:bg-background-custom transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmi}
                className="flex-1 rounded-full bg-primary py-2.5 text-xs font-black text-white hover:bg-secondary transition-colors uppercase tracking-wider"
              >
                Update EMI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
