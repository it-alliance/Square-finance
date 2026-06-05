'use client';

import { useState, useEffect } from 'react';
import { mockLoans } from '@/mock/loans';
import {
  mockPendingPayments,
  mockPartialPayments,
  mockFollowUps,
} from '@/mock/payments';
import { formatCurrency } from '@/utils/formatting';
import { Search, Info, X, AlertTriangle, CheckSquare, Trash2, CheckCircle2 } from 'lucide-react';

export default function ForeclosurePage() {
  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [activeLoan, setActiveLoan] = useState(null);

  // Form states
  const [remainingPrincipal, setRemainingPrincipal] = useState(0);
  const [foreclosureChargePercent, setForeclosureChargePercent] = useState(0);
  const [odAmount, setOdAmount] = useState(0);
  const [miscellaneousFee, setMiscellaneousFee] = useState(0);
  const [remarks, setRemarks] = useState('');

  // Calculations
  const [chargeAmount, setChargeAmount] = useState(0);
  const [totalPayAmount, setTotalPayAmount] = useState(0);

  // Modal active state: null | 'preview' | 'payment'
  const [activeModal, setActiveModal] = useState(null);

  // Modal step states
  const [paymentDate, setPaymentDate] = useState('');
  const [breakdownRows, setBreakdownRows] = useState([]);
  const [successPaymentDetails, setSuccessPaymentDetails] = useState(null);

  // Helper to normalize loan numbers for comparison (e.g. LN-001 -> LN001)
  const normalizeId = (id) => (id ? id.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : '');

  // Format date to YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Perform Loan Lookup
  const handleLookup = (e) => {
    e?.preventDefault();
    setSearchError('');
    
    if (!searchInput.trim()) {
      setSearchError('Please enter a loan number');
      return;
    }

    const normalizedQuery = normalizeId(searchInput);
    
    const loan = mockLoans.find(
      (l) => normalizeId(l.loanNumber) === normalizedQuery
    );

    if (!loan) {
      setSearchError('No loan record found for this loan number. Try LN-001 or LN002.');
      setActiveLoan(null);
      resetCalculator();
      return;
    }

    const paymentRecord =
      mockPendingPayments.find((p) => normalizeId(p.loanId) === normalizedQuery) ||
      mockPartialPayments.find((p) => normalizeId(p.loanId) === normalizedQuery) ||
      mockFollowUps.find((p) => normalizeId(p.loanId) === normalizedQuery);

    const principal = paymentRecord
      ? paymentRecord.remainingAmount
      : Math.round(loan.loanAmount * 0.25);

    setActiveLoan(loan);
    setRemainingPrincipal(principal);
    setForeclosureChargePercent(4); // Default foreclosure charge percent e.g. 4%
    setOdAmount(paymentRecord?.penalty || 0);
    setMiscellaneousFee(1500);
  };

  // Re-calculate foreclosure charge and total amount dynamically
  useEffect(() => {
    const charge = Math.round((remainingPrincipal * foreclosureChargePercent) / 100);
    const total = remainingPrincipal + charge + Number(odAmount) + Number(miscellaneousFee);
    
    setChargeAmount(charge);
    setTotalPayAmount(total);
  }, [remainingPrincipal, foreclosureChargePercent, odAmount, miscellaneousFee]);

  const resetCalculator = () => {
    setRemainingPrincipal(0);
    setForeclosureChargePercent(0);
    setOdAmount(0);
    setMiscellaneousFee(0);
    setRemarks('');
  };

  // Open Step 1 Preview Modal
  const handleOpenPreview = (e) => {
    e.preventDefault();
    if (!activeLoan) return;
    
    // Prefill date
    setPaymentDate(getTodayDateString());
    
    // Set initial breakdown rows
    setBreakdownRows([
      { id: Date.now(), mode: 'CASH', amount: totalPayAmount.toString() }
    ]);
    
    setActiveModal('preview');
  };

  // Sum of payments in breakdown rows
  const receivedTotalSum = breakdownRows.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  const isBreakdownValid = Math.round(receivedTotalSum) === Math.round(totalPayAmount);

  // Add split payment mode row
  const handleAddMode = () => {
    // Distribute remaining amount to new row
    const difference = Math.max(0, totalPayAmount - receivedTotalSum);
    setBreakdownRows([
      ...breakdownRows,
      { id: Date.now(), mode: 'ONLINE', amount: difference > 0 ? difference.toString() : '0' }
    ]);
  };

  // Delete payment mode row
  const handleRemoveMode = (id) => {
    if (breakdownRows.length <= 1) return;
    setBreakdownRows(breakdownRows.filter((r) => r.id !== id));
  };

  // Update breakdown row fields
  const handleUpdateRow = (id, key, val) => {
    setBreakdownRows(
      breakdownRows.map((row) => (row.id === id ? { ...row, [key]: val } : row))
    );
  };

  // Complete foreclosure and close loan
  const handleConfirmCloseLoan = (e) => {
    e.preventDefault();
    if (!activeLoan || !isBreakdownValid) return;

    // Save success receipt info
    setSuccessPaymentDetails({
      loanNumber: activeLoan.loanNumber,
      customerName: activeLoan.customerName,
      remainingPrincipal,
      foreclosureChargePercent,
      chargeAmount,
      odAmount,
      miscellaneousFee,
      totalPayAmount,
      paymentDate,
      breakdowns: breakdownRows,
      remarks,
    });

    // Reset all states
    setActiveModal(null);
    setActiveLoan(null);
    setSearchInput('');
    resetCalculator();
  };

  return (
    <div className="space-y-6">
      {/* Success Dialog Receipts */}
      {successPaymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl border border-gray-100 transform transition-all animate-scale-in">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Foreclosure Complete!</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Loan <strong>{successPaymentDetails.loanNumber}</strong> has been successfully settled and closed.
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="rounded-2xl bg-gray-50 p-4 space-y-2.5 border border-gray-200 text-xs text-left">
                <div className="flex justify-between border-b border-gray-200 pb-2 font-semibold text-text-primary">
                  <span>Customer Name:</span>
                  <span>{successPaymentDetails.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Principal:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(successPaymentDetails.remainingPrincipal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Foreclosure Charge ({successPaymentDetails.foreclosureChargePercent}%):</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(successPaymentDetails.chargeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>OD Amount:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(successPaymentDetails.odAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Misalliances Fee:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(successPaymentDetails.miscellaneousFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2.5 font-bold text-sm text-primary">
                  <span>Total Pay Amount:</span>
                  <span>{formatCurrency(successPaymentDetails.totalPayAmount)}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-2.5 space-y-1">
                  <span className="block font-bold text-[10px] text-gray-400 uppercase tracking-wider">Payment Breakdown ({successPaymentDetails.paymentDate})</span>
                  {successPaymentDetails.breakdowns.map((b, i) => (
                    <div key={i} className="flex justify-between text-[11px] font-semibold text-emerald-700">
                      <span className="uppercase">{b.mode}</span>
                      <span>{formatCurrency(parseFloat(b.amount || 0))}</span>
                    </div>
                  ))}
                </div>

                {successPaymentDetails.remarks && (
                  <div className="text-[11px] text-text-secondary border-t border-gray-200 pt-2">
                    <strong>Remarks:</strong> {successPaymentDetails.remarks}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSuccessPaymentDetails(null)}
                className="w-full rounded-2xl bg-primary py-3.5 text-xs font-bold text-white hover:bg-secondary transition-all shadow"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: FORECLOSURE PREVIEW OVERLAY MODAL */}
      {activeModal === 'preview' && activeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl border border-gray-200 transform transition-all animate-scale-in relative">
            
            {/* Header / Title */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                Foreclosure Preview
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="border border-gray-200 rounded-full p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4 py-6 text-xs">
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</span>
                <span className="font-black text-slate-800 text-sm">{activeLoan.customerName}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Loan Number</span>
                <span className="font-black text-blue-600 text-sm">{activeLoan.loanNumber}</span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Vehicle</span>
                <span className="font-black text-slate-800 text-sm">
                  {activeLoan.vehicleNumber} ({activeLoan.makeModel || '—'})
                </span>
              </div>
              <div>
                <span className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Remaining Principal</span>
                <span className="font-black text-slate-800 text-sm">{formatCurrency(remainingPrincipal)}</span>
              </div>
            </div>

            {/* Middle Total Box */}
            <div className="bg-[#111827] text-white p-6 rounded-2xl text-center shadow-md mb-6">
              <span className="block font-bold text-gray-400 uppercase tracking-widest text-[9px]">
                Total Foreclosure Amount
              </span>
              <span className="text-3xl font-black mt-1 block">
                {formatCurrency(totalPayAmount)}
              </span>
            </div>

            {/* Warning Alert Box */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-6">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide leading-relaxed">
                WARNING: THIS ACTION WILL CLOSE THE LOAN PERMANENTLY. ALL PENDING EMIS WILL BE MARKED AS PAID. THIS PROCESS CANNOT BE UNDONE.
              </p>
            </div>

            {/* Wizard Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold px-6 py-4 text-xs tracking-wider uppercase transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('payment')}
                className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/10"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PAYMENT DETAILS OVERLAY MODAL */}
      {activeModal === 'payment' && activeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl border border-gray-200 transform transition-all animate-scale-in relative">
            
            {/* Header / Title */}
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">
                Payment Details
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="border border-gray-200 rounded-full p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCloseLoan} className="py-4 space-y-5">
              
              {/* Payment Date Field */}
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1.5">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                />
              </div>

              {/* Payment Breakdown Rows */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                    Payment Breakdown
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMode}
                    className="text-blue-600 text-[10px] font-black hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    + Add Mode
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {breakdownRows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 animate-fade-in">
                      {/* Mode dropdown */}
                      <select
                        value={row.mode}
                        onChange={(e) => handleUpdateRow(row.id, 'mode', e.target.value)}
                        className="w-1/3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="CASH">CASH</option>
                        <option value="ONLINE">ONLINE</option>
                        <option value="CHEQUE">CHEQUE</option>
                      </select>

                      {/* Amount input */}
                      <div className="w-2/3 relative flex items-center">
                        <span className="absolute left-4 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Amount"
                          value={row.amount}
                          onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)}
                          className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-xs font-bold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Remove row */}
                      {breakdownRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMode(row.id)}
                          className="p-2 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-100 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Received Total Display */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">
                  Received Total
                </span>
                <span className="font-black text-emerald-600 text-sm">
                  {formatCurrency(receivedTotalSum)}
                </span>
              </div>

              {/* Validation Banner Indicator */}
              {isBreakdownValid ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                  <CheckSquare className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                    Amounts Verified. Ready to close the loan.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-[9px] font-bold text-red-800 uppercase tracking-wide">
                    Sum (₹{receivedTotalSum.toLocaleString()}) does not match Total (₹{totalPayAmount.toLocaleString()}).
                  </p>
                </div>
              )}

              {/* Wizard Buttons */}
              <div className="flex gap-4 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal('preview')}
                  className="w-1/3 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold px-6 py-4 text-xs tracking-wider uppercase transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!isBreakdownValid}
                  className="w-2/3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/10 disabled:bg-gray-200 disabled:text-text-secondary disabled:cursor-not-allowed disabled:shadow-none"
                >
                  Confirm & Close Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Left Card: Search & Loan Details (Columns 1-7) */}
        <div className="lg:col-span-7 bg-card-background border border-border-custom rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Header Search Section */}
          <div className="p-6 border-b border-border-custom bg-gray-50/20">
            <h3 className="text-base font-bold text-text-primary mb-3">Foreclosure Lookup</h3>
            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-neutral" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Loan Number (e.g. LN-001)"
                  className="w-full rounded-lg border border-border-custom bg-white py-2.5 pl-10 pr-4 text-sm placeholder-neutral focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary hover:bg-secondary px-5 text-sm font-semibold text-white transition-all hover:shadow"
              >
                Search
              </button>
            </form>
            {searchError && (
              <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{searchError}</p>
            )}
          </div>

          {/* Details Section */}
          <div className="p-6 flex-1 flex flex-col justify-start">
            {activeLoan ? (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-border-custom pb-3">
                  <div>
                    <h4 className="text-lg font-bold text-text-primary">{activeLoan.customerName}</h4>
                    <p className="text-xs font-mono font-semibold text-primary mt-0.5">Loan Reference: {activeLoan.loanNumber}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-success)] border border-[var(--color-success)]/10">
                    {activeLoan.status}
                  </span>
                </div>

                <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="block text-xs text-text-secondary font-medium">Mobile Number</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">{activeLoan.mobile}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-text-secondary font-medium">Vehicle Number</span>
                    <span className="font-mono font-semibold text-text-primary uppercase mt-0.5 block">{activeLoan.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-text-secondary font-medium">Model / Make</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">{activeLoan.makeModel}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-text-secondary font-medium">Previous Client Response</span>
                    <span className="italic text-text-primary mt-0.5 block">
                      "{activeLoan.clientResponse || 'Interested / Punctual'}"
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="block text-xs text-text-secondary font-medium">Customer Address</span>
                    <span className="text-text-primary mt-0.5 block">{activeLoan.currentAddress}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-secondary">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3 border border-border-custom">
                  <Info className="h-6 w-6 text-neutral" />
                </div>
                <p className="text-sm font-medium">No customer profile loaded.</p>
                <p className="text-xs text-neutral mt-1">Enter a valid loan number above to populate profile and calculate charges.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Financial Calculation & Settlement Form (Columns 8-12) */}
        <div className="lg:col-span-5 bg-card-background border border-border-custom rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary border-b border-border-custom pb-3 mb-4">
              Foreclosure Settlement Calculator
            </h3>

            <form onSubmit={handleOpenPreview} className="space-y-4">
              
              {/* Remaining Principal Display */}
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 flex justify-between items-center mb-2">
                <div>
                  <span className="block text-xs text-primary font-semibold uppercase tracking-wide">Remaining Principal</span>
                  <span className="text-2xl font-bold text-text-primary mt-0.5 block">
                    {formatCurrency(remainingPrincipal)}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-bold text-primary">₹</span>
                </div>
              </div>

              {/* Foreclosure Charge % Input */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Foreclosure Charge (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={!activeLoan}
                    value={foreclosureChargePercent}
                    onChange={(e) => setForeclosureChargePercent(Number(e.target.value))}
                    className="w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-xs text-text-primary font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-text-secondary">%</span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[11px] text-text-secondary">
                  <span>Charge Amount:</span>
                  <span className="font-semibold text-text-primary">{formatCurrency(chargeAmount)}</span>
                </div>
              </div>

              {/* OD Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  OD Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!activeLoan}
                  value={odAmount}
                  onChange={(e) => setOdAmount(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-xs text-text-primary font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Misalliances Fee Input */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Misalliances Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!activeLoan}
                  value={miscellaneousFee}
                  onChange={(e) => setMiscellaneousFee(e.target.value)}
                  className="w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-xs text-text-primary font-semibold focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Remarks
                </label>
                <textarea
                  disabled={!activeLoan}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add a remark for this foreclosure..."
                  rows="2"
                  className="w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-xs text-text-primary placeholder-neutral focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Total Pay Amount Summary Card */}
              <div className="border-t border-border-custom pt-4 mt-2">
                <div className="rounded-lg bg-gray-50 border border-border-custom p-3.5 flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-text-primary">Total Pay Amount:</span>
                  <span className="text-lg font-black text-primary">
                    {formatCurrency(totalPayAmount)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!activeLoan}
                  className="w-full rounded-lg bg-primary hover:bg-secondary py-3 text-xs font-bold text-white transition-all shadow hover:shadow-md disabled:bg-gray-200 disabled:text-text-secondary disabled:cursor-not-allowed"
                >
                  Pay Now
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
