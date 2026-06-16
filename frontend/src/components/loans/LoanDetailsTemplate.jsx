"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Phone,
  Car,
  MapPin,
  FileText,
  Shield,
  Hash,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Edit2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatting";
import { generateEmiSchedule } from "@/utils/generateEmiSchedule";
import StatusBadge from "@/components/common/StatusBadge";
import { apiClient } from "@/utils/apiClient";
import toast from "react-hot-toast";
import { mockMonthlyLoans } from "@/mock/monthlyLoans";
import { useAuthStore } from "@/store/authStore";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* ── Reusable detail field ────────────────────────────────── */
const DetailField = ({ label, value, highlight, phone, hasDropdown }) => (
  <div className="space-y-1.5 w-full">
    <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
      {label}
    </p>
    <div
      className={`flex items-center justify-between rounded-xl border border-border-custom bg-background-custom p-3.5 px-4 text-sm font-bold text-text-primary shadow-3xs hover:border-primary/30 hover:bg-background-custom/80 transition-all ${
        highlight ? "text-primary border-primary/20 bg-primary/5" : ""
      }`}
    >
      {phone && value ? (
        <a
          href={`tel:${value}`}
          className="hover:text-primary transition-colors hover:underline"
        >
          {value}
        </a>
      ) : (
        <span>{value || "N/A"}</span>
      )}
      {hasDropdown && (
        <ChevronDown className="h-4 w-4 text-neutral shrink-0 ml-2" />
      )}
    </div>
  </div>
);

/* ── Section card wrapper ─────────────────────────────────── */
const SectionCard = ({
  title,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  className = "",
}) => (
  <div
    className={`group/card rounded-2xl border border-border-custom bg-card-background shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 overflow-hidden ${className}`}
  >
    <div className="flex items-center gap-3 border-b border-border-custom bg-background-custom/30 px-6 py-4 transition-colors group-hover/card:bg-background-custom/50">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover/card:scale-105 ${iconBg} ${iconColor}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-text-primary leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-text-secondary font-semibold tracking-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

/* ── Map raw API loan object → UI shape ───────────────────── */
const mapLoanData = (d) => {
  if (!d) return null;

  // The detail endpoint (getById) returns raw flat fields with followUps array.
  // The list endpoint returns the formatted nested shape (loanTerms, customerDetails, etc.).
  const followUpsRaw = d.followUps || [];
  const sortedFollowUps = [...followUpsRaw].sort(
    (a, b) =>
      new Date(b.createdAt || b.promisedDate).getTime() -
      new Date(a.createdAt || a.promisedDate).getTime(),
  );

  return {
    id: d._id || d.id,
    loanType: d.loanType || "Monthly",
    loanNumber: d.loanTerms?.loanNumber || d.loanNumber,
    status: d.status?.status || d.status,
    createdAt: d.status?.createdAt || d.createdAt,
    dateLoanDisbursed: d.loanTerms?.dateLoanDisbursed || d.dateLoanDisbursed,
    emiStartDate: d.loanTerms?.emiStartDate || d.emiStartDate,
    emiEndDate: d.loanTerms?.emiEndDate || d.emiEndDate,
    loanAmount:
      d.loanTerms?.principalAmount ?? d.totalPrincipalAmount ?? d.loanAmount,
    interestRate: d.loanTerms?.annualInterestRate ?? d.interestRate,
    tenure: d.loanTerms?.tenureMonths ?? d.tenure,
    processingFeeRate: d.loanTerms?.processingFeeRate ?? d.processingFeeRate,
    // Use stored monthlyEMI from DB if available (raw response), else recalculate
    emiAmount: (() => {
      if (d.monthlyEMI) return d.monthlyEMI; // raw flat field from getById
      if (d.loanTerms?.monthlyEMI) return d.loanTerms.monthlyEMI;
      const type = d.loanType || "Monthly";
      const principal =
        d.loanTerms?.principalAmount ??
        d.totalPrincipalAmount ??
        d.loanAmount ??
        0;
      const rate = d.loanTerms?.annualInterestRate ?? d.interestRate ?? 0;
      const tenureVal = d.loanTerms?.tenureMonths ?? d.tenure ?? 1;
      if (type === "Daily" || type === "Weekly" || type === "Monthly") {
        const interestAmountPerPeriod = principal * (rate / 100);
        const totalInterest = tenureVal * interestAmountPerPeriod;
        return Math.ceil((principal + totalInterest) / tenureVal);
      }
      return d.emiAmount;
    })(),
    dueDate: d.loanTerms?.emiStartDate ?? d.dueDate,
    payments: d.payments || [],
    followUps: sortedFollowUps,

    // Support both API nested (d.customer.name) and flat mock (d.customerName)
    customerName:
      d.customerDetails?.customerName || d.customer?.name || d.customerName,
    panNumber:
      d.customerDetails?.panNumber || d.customer?.panNumber || d.panNumber,
    aadharNumber:
      d.customerDetails?.aadharNumber ||
      d.customer?.aadharNumber ||
      d.aadharNumber,
    ownRent:
      d.customerDetails?.ownRent ||
      d.customer?.ownershipType ||
      d.customer?.ownRent ||
      d.ownRent,
    mobile:
      d.customerDetails?.mobileNumbers?.[0] ||
      d.customer?.primaryMobile ||
      d.mobile,
    mobileNumbers: (d.customerDetails?.mobileNumbers || [])
      .map((n) => ({ number: n }))
      .concat(
        d.customer?.mobileNumbers?.map?.((n) =>
          typeof n === "string" ? { number: n } : n,
        ) ||
          d.mobileNumbers ||
          [],
      ),
    customerAddress:
      d.customerDetails?.address ||
      d.customer?.currentAddress ||
      d.currentAddress ||
      d.customerAddress,
    customerPincode: d.customer?.pincode || d.customerPincode,

    guarantorName:
      d.customerDetails?.guarantorName ||
      d.customer?.guarantorName ||
      d.guarantorName,
    guarantorAadhar: d.customer?.guarantorAadhar || d.guarantorAadhar,
    primaryGuarantorMobile:
      d.customerDetails?.guarantorMobileNumbers?.[0] ||
      d.customer?.primaryGuarantorMobile ||
      d.customer?.guarantorMobile ||
      d.primaryGuarantorMobile,
    guarantorMobileNumbers: (d.customerDetails?.guarantorMobileNumbers || [])
      .map((n) => ({ number: n }))
      .concat(
        d.customer?.guarantorMobileNumbers?.map?.((n) =>
          typeof n === "string" ? { number: n } : n,
        ) ||
          d.guarantorMobileNumbers ||
          [],
      ),
    guarantorAddress: d.customer?.guarantorAddress || d.guarantorAddress,
    guarantorPincode: d.customer?.guarantorPincode || d.guarantorPincode,

    vehicleNumber: d.vehicleInformation?.vehicleNumber || d.vehicleNumber,
    makeModel:
      d.vehicleInformation?.typeOfVehicle || d.typeOfVehicle || d.makeModel,
    modelYear: d.vehicleInformation?.modelYear || d.modelYear,
    chassisNumber: d.vehicleInformation?.chassisNumber || d.chassisNumber,
    engineNumber: d.vehicleInformation?.engineNumber || d.engineNumber,
    typeOfVehicle: d.vehicleInformation?.typeOfVehicle || d.typeOfVehicle,
    boardType: d.vehicleInformation?.ywBoard || d.boardType,
    hpEntry: d.vehicleInformation?.hpEntry || d.hpEntry,
    rtoPending: d.vehicleInformation?.rtoWorkPending || d.rtoPending || [],
    dealerName: d.vehicleInformation?.dealerName || d.dealerName,
    dealerNumber: d.vehicleInformation?.dealerNumber || d.dealerNumber,
    fcDate: d.vehicleInformation?.fcDate || d.fcDate,
    insuranceDate: d.vehicleInformation?.insuranceDate || d.insuranceDate,

    remarks:
      d.status?.remarks ||
      sortedFollowUps[0]?.employeeComment ||
      d.remarks ||
      "",
    followUpDate:
      d.status?.nextFollowUpDate ||
      sortedFollowUps[0]?.promisedDate ||
      d.nextFollowupDate ||
      d.followUpDate ||
      null,
    createdBy: d.status?.createdBy || d.createdBy || "System Admin",
    updatedBy: d.status?.updatedBy || d.updatedBy || "System Admin",
    updatedAt: d.status?.updatedAt || d.updatedAt || d.createdAt,
  };
};

export default function LoanDetailsTemplate({ loanType, loanId }) {
  /* ── State ── */
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const user = useAuthStore((state) => state.user);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusRemarks, setStatusRemarks] = useState(loan?.remarks || "");
  const [statusFollowUpDate, setStatusFollowUpDate] = useState(
    loan?.followUpDate
      ? new Date(loan.followUpDate).toISOString().split("T")[0]
      : "",
  );

  const routePrefix = `/${loanType.toLowerCase()}-loans`;

  /* ── ALL hooks must live above any conditional return ── */

  // EMI schedule — computed even when loan is null (returns [])
  const schedule = useMemo(() => {
    if (!loan) return [];

    const baseSchedule = generateEmiSchedule(
      loan.loanAmount,
      loan.tenure,
      loan.emiStartDate,
      loan.id,
      loan.loanType || loanType,
      loan.interestRate,
    );

    // Merge actual payments recorded in the DB
    if (loan.payments && loan.payments.length > 0) {
      const paymentsCopy = loan.payments
        .map((p) => ({
          amountPaid: Number(p.amountPaid || p.amount || 0),
          date: p.date || p.paymentDate,
          paymentMode: p.paymentMode || p.mode || "Cash",
        }))
        .filter((p) => p.amountPaid > 0);

      let paymentIndex = 0;
      return baseSchedule.map((emi) => {
        let remaining = emi.emiAmount;
        const emiPayments = [];

        while (paymentIndex < paymentsCopy.length && remaining > 0) {
          const p = paymentsCopy[paymentIndex];
          const used = Math.min(remaining, p.amountPaid);
          emiPayments.push({
            paymentDate: p.date,
            paymentMode: p.paymentMode,
            amount: used,
          });
          remaining -= used;
          p.amountPaid -= used;
          if (p.amountPaid <= 0) paymentIndex++;
        }

        const totalPaid = emiPayments.reduce((s, p) => s + p.amount, 0);
        const paymentStatus =
          totalPaid >= emi.emiAmount
            ? "Paid"
            : totalPaid > 0
              ? "Partial"
              : "Pending";

        return {
          ...emi,
          payments: emiPayments,
          totalPaid,
          remainingAmount: Math.max(0, emi.emiAmount - totalPaid),
          paymentStatus,
          approvedBy: "System Admin",
          lastUpdated:
            emiPayments.length > 0
              ? emiPayments[emiPayments.length - 1].paymentDate
              : "-",
        };
      });
    }

    return baseSchedule;
  }, [loan, loanType]);

  const totalCollectedAmount = useMemo(() => {
    return (
      loan?.payments?.reduce(
        (s, p) => s + Number(p.amountPaid || p.amount || 0),
        0,
      ) || 0
    );
  }, [loan]);

  const upcomingDueDate = useMemo(() => {
    if (!schedule || schedule.length === 0) return loan?.emiStartDate || "";
    const upcoming = schedule.find((item) => item.paymentStatus !== "Paid");
    return upcoming
      ? upcoming.dueDate
      : schedule[0]?.dueDate || loan?.emiStartDate || "";
  }, [schedule, loan]);

  // Derived financial values (null-safe)
  const processingFee =
    ((loan?.processingFeeRate || 0) / 100) * (loan?.loanAmount || 0);

  const derivedFinancials = (() => {
    const principal = loan?.loanAmount || 0;
    const rate = loan?.interestRate || 0;
    const tenureVal = loan?.tenure || 0;
    const type = loan?.loanType || loanType;

    if (tenureVal <= 0) {
      return { calculatedEMI: 0, totalInterest: 0, totalRepayable: 0 };
    }

    if (type === "Daily" || type === "Weekly" || type === "Monthly") {
      const interestAmountPerPeriod = principal * (rate / 100);
      const totalInterest = tenureVal * interestAmountPerPeriod;
      const totalRepayable = principal + totalInterest;
      const calculatedEMI = Math.ceil(totalRepayable / tenureVal);
      return { calculatedEMI, totalInterest, totalRepayable };
    } else {
      const monthlyRate = rate / 100 / 12;
      const calculatedEMI =
        monthlyRate > 0
          ? (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureVal)) /
            (Math.pow(1 + monthlyRate, tenureVal) - 1)
          : 0;
      const totalRepayable = calculatedEMI * tenureVal;
      const totalInterest = totalRepayable - principal;
      return { calculatedEMI, totalInterest, totalRepayable };
    }
  })();

  const calculatedEMI = derivedFinancials.calculatedEMI;
  const totalRepayable = derivedFinancials.totalRepayable;
  const totalInterest = derivedFinancials.totalInterest;

  // Mobile collections (null-safe)
  const allMobiles = loan
    ? [
        loan.mobile,
        ...(loan.mobileNumbers || [])
          .map((m) => m.number)
          .filter((n) => n !== loan.mobile),
      ].filter(Boolean)
    : [];
  const allGuarantorMobiles = loan
    ? [
        loan.primaryGuarantorMobile,
        ...(loan.guarantorMobileNumbers || [])
          .map((m) => m.number)
          .filter((n) => n !== loan.primaryGuarantorMobile),
      ].filter(Boolean)
    : [];

  /* ── Data fetching ── */
  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setLoading(true);
        setError(null);

        // Direct GET /api/monthly-loans/:id call to the backend
        const endpoint = `/${loanType.toLowerCase()}-loans/${loanId}`;
        const res = await apiClient.get(endpoint);
        if (res.status === "success" || res.success) {
          const loanData = res.data || res;
          setLoan(mapLoanData(loanData));
          setLoading(false);
          return;
        }

        // Not found — show search verification panel
        setSearchMode(true);
      } catch (err) {
        // Fallback: try fetching the list and finding by ID
        try {
          const listEndpoint = `/${loanType.toLowerCase()}-loans?limit=1000&page=1`;
          const listRes = await apiClient.get(listEndpoint);
          if (listRes.status === "success" || listRes.success) {
            const loansArray = listRes.data?.data || listRes.data || [];
            const found = loansArray.find((l) => (l._id || l.id) === loanId);
            if (found) {
              setLoan(mapLoanData(found));
              setLoading(false);
              return;
            }
          }
        } catch (fallbackErr) {
          /* ignore */
        }
        setError(err.message || "Failed to load loan");
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [loanId, loanType]);

  /* ── Search handler ── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError(null);
    try {
      const q = searchQuery.trim().toLowerCase();

      // ── API search for other loan types ──
      const endpoint = `/${loanType.toLowerCase()}-loans`;
      let res = await apiClient.get(
        `${endpoint}?loanNumber=${encodeURIComponent(q)}`,
      );
      if (!res.success || !res.data || res.data.length === 0) {
        res = await apiClient.get(
          `${endpoint}?customerName=${encodeURIComponent(q)}`,
        );
      }

      if (res.success && res.data && res.data.length > 0) {
        const matched = res.data.find((l) => l.id === loanId) || res.data[0];
        try {
          const cacheKey = `${loanType.toLowerCase()}_loans_cache`;
          const cache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
          res.data.forEach((l) => {
            cache[l.id] = l;
          });
          localStorage.setItem(cacheKey, JSON.stringify(cache));
        } catch (e) {
          /* ignore */
        }

        setLoan(mapLoanData(matched));
        setSearchMode(false);
        toast.success("Loan loaded successfully!");
      } else {
        throw new Error("No matching loan found.");
      }
    } catch (err) {
      setSearchError(err.message || "Verification failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveStatus = async () => {
    try {
      const endpoint = `/${loanType.toLowerCase()}-loans/${loanId}`;
      const payload = {
        status: {
          status: loan.status,
          remarks: statusRemarks,
          clientResponse: statusRemarks,
          nextFollowUpDate: statusFollowUpDate || null,
        },
      };

      const res = await apiClient.put(endpoint, payload);
      if (res.status === "success" || res.success) {
        toast.success("Status updated successfully!");
        setIsEditingStatus(false);
        // Reload details
        const refreshed = await apiClient.get(endpoint);
        setLoan(mapLoanData(refreshed.data || refreshed));
      } else {
        throw new Error(res.message || "Failed to update status");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    }
  };

  const handleClearStatus = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear the follow-up date and remarks?",
      )
    )
      return;
    try {
      const endpoint = `/${loanType.toLowerCase()}-loans/${loanId}`;

      const payload = {
        status: {
          status: loan.status,
          remarks: "",
          clientResponse: "Cleared",
          nextFollowUpDate: "",
        },
      };

      const res = await apiClient.put(endpoint, payload);
      if (res.status === "success" || res.success) {
        toast.success("Status updated successfully!");
        // Reload details
        const refreshed = await apiClient.get(endpoint);
        setLoan(mapLoanData(refreshed.data || refreshed));
      } else {
        throw new Error(res.message || "Failed to update status");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    }
  };

  /* ── Conditional renders (ALL hooks are above this line) ── */

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  if (searchMode || error || !loan) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-border-custom rounded-2xl shadow-sm max-w-md mx-auto my-16">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Shield className="h-7 w-7" />
        </div>
        <h2 className="text-base font-black text-text-primary mb-2 text-center uppercase tracking-tight">
          Verify Loan Details
        </h2>
        <p className="text-xs text-text-secondary mb-6 text-center max-w-xs leading-relaxed">
          Enter the <strong>Loan Number</strong> (e.g.&nbsp;ML-1001) or{" "}
          <strong>Customer Name</strong> to load this loan profile.
        </p>

        <div className="w-full space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Loan Number or Customer Name…"
              className="w-full h-[42px] rounded-xl border border-border-custom bg-slate-50/50 px-4 pr-14 text-text-primary placeholder-neutral focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-semibold"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-3 py-1 text-white font-bold text-xs hover:bg-secondary transition-colors disabled:opacity-40"
            >
              {isSearching ? "…" : "Search"}
            </button>
          </div>

          {searchError && (
            <p className="text-[11px] font-bold text-rose-500 text-center">
              {searchError}
            </p>
          )}
          {error && !searchMode && (
            <p className="text-[11px] font-bold text-rose-500 text-center">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Link
              href={routePrefix}
              className="flex-1 text-center py-2.5 rounded-xl border border-border-custom text-xs font-bold text-text-secondary hover:bg-slate-50 transition-colors uppercase tracking-wider"
            >
              ← Back
            </Link>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Loading…" : "Load Profile"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render (loan is guaranteed non-null here) ── */
  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ─── */}
      <div className="sticky top-[-12px] sm:top-[-16px] md:top-[-24px] z-30 -mt-3 sm:-mt-4 md:-mt-6 -mx-3 sm:-mx-4 md:-mx-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 bg-white border-b border-border-custom shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 mb-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href={routePrefix}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-text-secondary shadow-sm transition-all hover:bg-background-custom hover:text-text-primary border border-border-custom hover:scale-105 active:scale-95 shrink-0"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-text-primary uppercase tracking-tight">
              Loan Profile View
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-text-secondary uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-secondary font-extrabold">
                Loan No.
              </span>
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-black text-primary">
                {loan.loanNumber}
              </span>
            </div>
            {loan.vehicleNumber &&
              loanType !== "Daily" &&
              loanType !== "Weekly" && (
                <>
                  <span className="text-neutral/50 hidden sm:inline">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-secondary font-extrabold">
                      Vehicle
                    </span>
                    <span className="rounded-md border border-border-custom bg-background-custom px-2 py-1 text-[11px] font-black text-text-primary">
                      {loan.vehicleNumber}
                    </span>
                  </div>
                </>
              )}
          </div>
        </div>

        {/* Right side: Status badge and Edit button */}
        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border shadow-3xs ${
              loan.status === "Active"
                ? "bg-[var(--color-success-bg)] text-success border-[var(--color-success)]/10"
                : loan.status === "Overdue"
                  ? "bg-[#FEE2E2] text-danger border-[var(--color-danger)]/10"
                  : "bg-[#F3F4F6] text-text-secondary border-border-custom"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loan.status === "Active"
                  ? "bg-success"
                  : loan.status === "Overdue"
                    ? "bg-danger"
                    : "bg-text-secondary"
              }`}
            />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-background-custom border border-border-custom p-3.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary shadow-2xs">
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-neutral shrink-0" />
          <span>Created by:</span>
          <span className="text-text-primary font-extrabold truncate">
            {loan.createdBy || "System Admin"} (
            {loan.createdAt ? formatDateTime(loan.createdAt) : "N/A"})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-neutral shrink-0" />
          <span>Last Updated:</span>
          <span className="text-text-primary font-extrabold truncate">
            {loan.updatedBy || user?.name || "System Admin"} (
            {loan.updatedAt ? formatDateTime(loan.updatedAt) : "N/A"})
          </span>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="group rounded-2xl p-4.5 text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.01]"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
            Loan Amount
          </p>
          <p className="text-2xl font-extrabold mt-1.5 tracking-tight">
            {formatCurrency(loan.loanAmount)}
          </p>
        </div>
        <div className="group rounded-2xl border border-border-custom bg-card-background p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            {loanType === "Weekly"
              ? "Weekly EMI"
              : loanType === "Daily"
                ? "Daily EMI"
                : "Monthly EMI"}
          </p>
          <p className="text-2xl font-extrabold text-text-primary mt-1.5 tracking-tight">
            {formatCurrency(loan.emiAmount || calculatedEMI)}
          </p>
        </div>
        <div className="group rounded-2xl border border-border-custom bg-card-background p-4.5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
            Status
          </p>
          <div className="mt-2">
            <StatusBadge status={loan.status} />
          </div>
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
              <DetailField
                label="Ownership Type"
                value={loan.ownRent}
                hasDropdown
              />
              <DetailField
                label="Current Address"
                value={loan.currentAddress || loan.customerAddress}
              />

              <div className="group flex flex-col gap-1.5 rounded-xl border border-border-custom bg-background-custom p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-background-custom sm:col-span-2 shadow-3xs">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                  Customer Mobile Number(s)
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allMobiles.map((num, i) => (
                    <a
                      key={i}
                      href={`tel:${num}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border-custom hover:border-primary/50 hover:text-primary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all shadow-2xs hover:scale-102"
                    >
                      <Phone className="h-3.5 w-3.5 text-neutral" /> {num}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-dashed border-border-custom">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                Guarantor Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <DetailField
                    label="Guarantor Name"
                    value={loan.guarantorName}
                  />
                </div>
                <div className="group flex flex-col gap-1.5 rounded-xl border border-border-custom bg-background-custom p-3.5 transition-all duration-200 hover:border-primary/30 hover:bg-background-custom sm:col-span-2 shadow-3xs">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                    Guarantor Mobile Number(s)
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {allGuarantorMobiles.length > 0 ? (
                      allGuarantorMobiles.map((num, i) => (
                        <a
                          key={i}
                          href={`tel:${num}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-border-custom hover:border-primary/50 hover:text-primary px-3 py-1.5 text-xs font-semibold text-text-primary transition-all shadow-2xs hover:scale-102"
                        >
                          <Phone className="h-3.5 w-3.5 text-neutral" /> {num}
                        </a>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-neutral italic">
                        No guarantor mobiles registered
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {loanType !== "Daily" && loanType !== "Weekly" && (
            <SectionCard
              title="Vehicle Details"
              subtitle="Registration, model specifications, and dealership info"
              icon={Car}
              iconBg="bg-primary/10"
              iconColor="text-primary"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailField
                  label="Vehicle Number"
                  value={loan.vehicleNumber}
                />
                <DetailField label="Make & Model" value={loan.makeModel} />
                <DetailField label="Model Year" value={loan.modelYear} />
                <DetailField
                  label="Chassis Number"
                  value={loan.chassisNumber}
                />
                <DetailField label="Engine Number" value={loan.engineNumber} />
                <DetailField
                  label="Type of Vehicle"
                  value={loan.typeOfVehicle}
                />
                <DetailField
                  label="Board Type"
                  value={
                    loan.boardType === "Yellow"
                      ? "Yellow (Commercial)"
                      : "White (Private)"
                  }
                  hasDropdown
                />
                <DetailField
                  label="HP Entry"
                  value={loan.hpEntry}
                  hasDropdown
                />

                <div className="space-y-1.5 w-full">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral">
                    RTO Work Pending
                  </p>
                  <div className="flex flex-wrap gap-1.5 p-1">
                    {loan.rtoPending && loan.rtoPending.length > 0 ? (
                      loan.rtoPending.map((task, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-extrabold text-primary shadow-3xs uppercase tracking-wide"
                        >
                          {task}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-neutral italic">
                        No tasks pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-dashed border-border-custom">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                  Dealer & Registration Timings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailField label="Dealer Name" value={loan.dealerName} />
                  <DetailField
                    label="Dealer Contact"
                    value={loan.dealerNumber}
                    phone
                  />
                  <div className="hidden lg:block"></div>
                  <DetailField
                    label="FC Date"
                    value={loan.fcDate ? formatDate(loan.fcDate) : "N/A"}
                  />
                  <DetailField
                    label="Insurance Date"
                    value={
                      loan.insuranceDate
                        ? formatDate(loan.insuranceDate)
                        : "N/A"
                    }
                  />
                </div>
              </div>
            </SectionCard>
          )}
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
              <DetailField
                label="Total Principal"
                value={formatCurrency(loan.loanAmount)}
                highlight
              />
              <DetailField
                label="Interest Rate"
                value={`${loan.interestRate ?? "N/A"}%`}
              />
              <DetailField
                label="Tenure"
                value={`${loan.tenure || "N/A"} ${loanType === "Weekly" ? "Weeks" : loanType === "Daily" ? "Days" : "Months"}`}
              />
              <DetailField
                label="Processing Fee Rate"
                value={`${loan.processingFeeRate ?? "N/A"}%`}
              />
              <DetailField
                label="Processing Fee"
                value={formatCurrency(processingFee)}
              />
              <DetailField
                label={
                  loanType === "Weekly"
                    ? "Weekly EMI"
                    : loanType === "Daily"
                      ? "Daily EMI"
                      : "Monthly EMI"
                }
                value={formatCurrency(loan.emiAmount || calculatedEMI)}
                highlight
              />
            </div>
          </SectionCard>

          <div className="rounded-2xl border border-accent bg-secondary text-white shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between border-b border-accent bg-accent/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-warning">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    Status Update (Client Response)
                  </h2>
                  <p className="text-[11px] text-white/70 font-semibold mt-0.5">
                    Follow-up date, client response log, and notes
                  </p>
                </div>
              </div>
              {!isEditingStatus && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="inline-flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-[11px] font-bold text-white hover:bg-accent/80 transition-all cursor-pointer border border-accent"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleClearStatus}
                    className="inline-flex items-center gap-1 rounded bg-danger/80 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-danger transition-all cursor-pointer border border-accent"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
            {isEditingStatus ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                    Follow-up Date (Client Response)
                  </label>
                  <input
                    type="date"
                    value={statusFollowUpDate}
                    onChange={(e) => setStatusFollowUpDate(e.target.value)}
                    className="w-full rounded-xl border border-accent bg-accent/50 px-3 py-2 text-sm text-white/95 focus:border-warning focus:ring-2 focus:ring-warning/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                    Client Response / Remarks
                  </label>
                  <textarea
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    placeholder="Enter client response or remarks..."
                    rows="4"
                    className="w-full rounded-xl border border-accent bg-accent/50 px-3 py-2 text-sm text-white/95 focus:border-warning focus:ring-2 focus:ring-warning/20 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingStatus(false)}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent/80 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveStatus}
                    className="rounded-lg bg-warning px-4 py-2 text-xs font-bold text-secondary hover:bg-warning/90 transition-all cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                    Client Response / Remarks
                  </p>
                  <div className="rounded-xl bg-accent/50 border border-accent p-3.5 text-xs text-white/95 font-medium leading-relaxed">
                    {loan.remarks || "No remarks available."}
                  </div>
                  {loan.followUpDate && (
                    <div className="mt-3.5 flex items-center gap-2 text-xs font-bold text-warning">
                      <Calendar className="h-3.5 w-3.5" /> Follow-up Date:{" "}
                      <span className="text-white font-extrabold">
                        {formatDate(loan.followUpDate)}
                      </span>
                    </div>
                  )}
                  <div className="mt-3.5 pt-3 border-t border-accent/20 flex flex-wrap gap-4 text-[10px] font-bold text-white/60">
                    <div>
                      <span className="uppercase tracking-wider">
                        Last Updated By:{" "}
                      </span>
                      <span className="text-white/95">
                        {loan.updatedBy || user?.name || "System Admin"}
                      </span>
                    </div>
                    <div>
                      <span className="uppercase tracking-wider">
                        Last Updated:{" "}
                      </span>
                      <span className="text-white/95">
                        {formatDateTime(loan.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Date Disbursed
                </p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">
                  {loan.dateLoanDisbursed
                    ? formatDate(loan.dateLoanDisbursed)
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-success-bg)] text-success shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  EMI Start Date
                </p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">
                  {loan.emiStartDate ? formatDate(loan.emiStartDate) : "N/A"}
                </p>
              </div>
            </div>
            <div className="group flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom/20 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-background-custom/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  EMI End Date
                </p>
                <p className="text-base font-extrabold text-text-primary mt-0.5">
                  {loan.emiEndDate ? formatDate(loan.emiEndDate) : "N/A"}
                </p>
              </div>
            </div>
            <div className="group flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 transition-all duration-200 hover:border-warning/50 hover:bg-warning/10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20 text-warning shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-warning/80 uppercase tracking-wider">
                  Next EMI Due Date
                </p>
                <p className="text-base font-extrabold text-warning mt-0.5">
                  {upcomingDueDate ? formatDate(upcomingDueDate) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-5 border-t border-border-custom">
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                {loanType === "Weekly"
                  ? "Weekly EMI"
                  : loanType === "Daily"
                    ? "Daily EMI"
                    : "Monthly EMI"}
              </p>
              <p className="text-lg font-extrabold text-text-primary mt-2">
                {formatCurrency(loan.emiAmount || calculatedEMI)}
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                Total Collected Amount
              </p>
              <p className="text-lg font-extrabold text-success mt-2">
                {formatCurrency(totalCollectedAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                Total Expenses
              </p>
              <p className="text-lg font-extrabold text-text-primary mt-2">
                {formatCurrency(0)}
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                Total Interest Amount
              </p>
              <p className="text-lg font-extrabold text-primary mt-2">
                +{formatCurrency(totalInterest)}
              </p>
            </div>
            <div className="rounded-xl border border-border-custom bg-background-custom/30 p-4.5 hover:bg-background-custom/60 transition-colors">
              <p className="text-[9px] font-bold text-text-secondary uppercase tracking-wider leading-none">
                Remaining Principal Amount
              </p>
              <p className="text-lg font-extrabold text-danger mt-2">
                {formatCurrency(
                  Math.max(0, totalRepayable - totalCollectedAmount),
                )}
              </p>
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
              <h2 className="text-base font-bold text-text-primary">
                EMI Payment Schedule
              </h2>
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
                <th className="px-6 py-4 font-bold tracking-wider">
                  EMI Amount
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">Mode</th>
                <th className="px-6 py-4 font-bold tracking-wider text-danger">
                  Overdue
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">Payment</th>
                <th className="px-6 py-4 font-bold tracking-wider">Remarks</th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Approved By
                </th>
                <th className="px-6 py-4 font-bold tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom bg-card-background">
              {schedule.length > 0 ? (
                schedule.map((item, index) => {
                  const isPaid = item.paymentStatus === "Paid";
                  const lastPayment = item.payments?.[item.payments.length - 1];
                  const totalOverdue =
                    item.overdues?.reduce(
                      (s, o) => s + Number(o.amount || 0),
                      0,
                    ) ?? 0;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-background-custom transition-colors duration-150"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">
                        {index + 1}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-text-secondary">
                        {formatDate(item.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">
                        {formatCurrency(item.emiAmount)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-6 py-4 font-bold ${isPaid ? "text-success" : "text-text-secondary/50"}`}
                      >
                        {item.totalPaid > 0
                          ? formatCurrency(item.totalPaid)
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {lastPayment?.paymentDate
                          ? formatDate(lastPayment.paymentDate)
                          : "-"}
                        {item.payments?.length > 1 && (
                          <span className="ml-1 text-[9px] text-primary font-bold">
                            (+{item.payments.length - 1})
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {lastPayment?.paymentMode ? (
                          <span className="inline-flex rounded-md bg-background-custom border border-border-custom px-2 py-0.5 text-[9px] font-extrabold text-text-secondary uppercase tracking-wider">
                            {lastPayment.paymentMode}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-bold text-danger">
                        {totalOverdue > 0 ? formatCurrency(totalOverdue) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wider uppercase shadow-3xs border ${
                            item.paymentStatus === "Paid"
                              ? "bg-[var(--color-success-bg)] text-success border border-[var(--color-success)]/10"
                              : item.paymentStatus === "Partial"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-[var(--color-warning-bg)] text-warning border border-[var(--color-warning)]/10"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-xs font-medium text-text-secondary max-w-[200px] truncate"
                        title={item.remarks}
                      >
                        {item.remarks || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-text-primary">
                        {item.approvedBy}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                        {item.lastUpdated !== "-"
                          ? formatDateTime(item.lastUpdated)
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="11"
                    className="px-6 py-12 text-center text-text-secondary font-medium italic"
                  >
                    No payment schedule found for this loan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-Up History */}
      {loan.followUps && loan.followUps.length > 0 && (
        <div className="rounded-2xl border border-border-custom bg-card-background shadow-sm overflow-hidden">
          <div className="border-b border-border-custom bg-background-custom/30 p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Follow-Up History
              </h2>
              <p className="text-[11px] font-semibold text-text-secondary mt-0.5">
                {loan.followUps.length} follow-up
                {loan.followUps.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-background-custom text-[10px] uppercase text-primary border-b border-border-custom">
                <tr>
                  <th className="px-6 py-4 font-bold tracking-wider">#</th>
                  <th className="px-6 py-4 font-bold tracking-wider">
                    Promised / Follow-Up Date
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider">
                    Client Response / Remarks
                  </th>
                  <th className="px-6 py-4 font-bold tracking-wider">
                    Recorded On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom bg-card-background">
                {loan.followUps.map((fu, index) => (
                  <tr
                    key={fu.id || index}
                    className="hover:bg-background-custom transition-colors duration-150"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-bold text-text-primary">
                      {loan.followUps.length - index}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-text-secondary">
                      {fu.promisedDate ? formatDate(fu.promisedDate) : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-text-secondary max-w-[300px]">
                      {fu.employeeComment || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold text-text-secondary">
                      {fu.createdAt ? formatDateTime(fu.createdAt) : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
