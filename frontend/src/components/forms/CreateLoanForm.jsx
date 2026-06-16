"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { generateEmiSchedule } from "@/utils/generateEmiSchedule";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoanSchema } from "@/schemas/loanSchema";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  User,
  Car,
  DollarSign,
  Calendar,
  Settings,
  Phone,
  FileText,
  AlertCircle,
  ArrowLeft,
  Percent,
  CreditCard,
  Sparkles,
  Building,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiClient } from "@/utils/apiClient";
import { useAuthStore } from "@/store/authStore";

const formatDateTime = (dateStr) => {
  if (!dateStr || dateStr === "-") return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function CreateLoanForm({ loan, defaultLoanType = "Monthly" }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingFee, setProcessingFee] = useState(0);
  const [monthlyEMI, setMonthlyEMI] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [remainingPrincipal, setRemainingPrincipal] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tempPayments, setTempPayments] = useState([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(createLoanSchema),
    defaultValues: loan
      ? {
          ...loan,
          totalPrincipalAmount: loan.loanAmount,
          primaryMobileNumber: loan.mobile,
          payments: loan.payments || [
            {
              date: loan.dateLoanDisbursed || "",
              mode: "Cash",
              amount: loan.loanAmount || 0,
            },
          ],
        }
      : {
          status: "Active",
          ownRent: "Own",
          typeOfVehicle: "4-Wheeler",
          boardType: "White",
          hpEntry: "Not Done",
          mobileNumbers: [],
          guarantorMobileNumbers: [],
          rtoPending: [],
          loanType: defaultLoanType,
          payments: [
            {
              date: new Date().toISOString().split("T")[0],
              mode: "Cash",
              amount: 0,
            },
          ],
        },
  });

  const {
    fields: mobileFields,
    append: appendMobile,
    remove: removeMobile,
  } = useFieldArray({
    control,
    name: "mobileNumbers",
  });

  const {
    fields: guarantorFields,
    append: appendGuarantor,
    remove: removeGuarantor,
  } = useFieldArray({
    control,
    name: "guarantorMobileNumbers",
  });

  // Watch values for auto-calculation
  const totalPrincipal = watch("totalPrincipalAmount") || 0;
  const processingRate = watch("processingFeeRate") || 0;
  const interestRate = watch("interestRate") || 0;
  const tenure = watch("tenure") || 0;
  const loanType = watch("loanType") || defaultLoanType;

  // Live financial calculations for the summary bar
  const derivedFinancials = (() => {
    if (tenure <= 0) {
      return { calculatedEMI: 0, totalInterest: 0, totalRepayable: 0 };
    }

    if (
      loanType === "Daily" ||
      loanType === "Weekly" ||
      loanType === "Monthly"
    ) {
      const interestAmountPerPeriod = totalPrincipal * (interestRate / 100);
      const totalInterest = tenure * interestAmountPerPeriod;
      const totalRepayable = totalPrincipal + totalInterest;
      const calculatedEMI = Math.ceil(totalRepayable / tenure);
      return { calculatedEMI, totalInterest, totalRepayable };
    } else {
      const monthlyRate = interestRate / 100 / 12;
      const calculatedEMI =
        monthlyRate > 0
          ? (totalPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
            (Math.pow(1 + monthlyRate, tenure) - 1)
          : 0;
      const totalRepayable = calculatedEMI * tenure;
      const totalInterest = totalRepayable - totalPrincipal;
      return { calculatedEMI, totalInterest, totalRepayable };
    }
  })();

  const [customRtoTask, setCustomRtoTask] = useState("");
  const [rtoDropdownOpen, setRtoDropdownOpen] = useState(false);
  const rtoDropdownRef = useRef(null);
  const rtoPendingList = watch("rtoPending") || [];
  const paymentsList = watch("payments") || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        rtoDropdownRef.current &&
        !rtoDropdownRef.current.contains(e.target)
      ) {
        setRtoDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddRtoTask = (taskName) => {
    if (!taskName) return;
    const trimmed = taskName.trim();
    if (trimmed && !rtoPendingList.includes(trimmed)) {
      setValue("rtoPending", [...rtoPendingList, trimmed], {
        shouldValidate: true,
      });
    }
  };

  const handleRemoveRtoTask = (taskName) => {
    setValue(
      "rtoPending",
      rtoPendingList.filter((t) => t !== taskName),
      { shouldValidate: true },
    );
  };

  // Auto-calculate Principal from Payments
  useEffect(() => {
    const sum = paymentsList.reduce(
      (acc, curr) => acc + (Number(curr.amount) || 0),
      0,
    );
    setValue("totalPrincipalAmount", sum, { shouldValidate: true });
  }, [paymentsList, setValue]);

  const loanNumberValue = watch("loanNumber");

  // Real-time validation for duplicate Loan Number
  useEffect(() => {
    // Skip check if editing an existing loan or if the field is empty
    if (loan || !loanNumberValue || typeof loanNumberValue !== "string") {
      clearErrors("loanNumber");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const endpoint = `/${loanType.toLowerCase()}-loans?loanNumber=${encodeURIComponent(loanNumberValue)}`;
        const response = await apiClient.get(endpoint);

        const itemsCount = response.data?.items || 0;
        const fetchedLoans = response.data?.data || [];

        if (itemsCount > 0 && Array.isArray(fetchedLoans)) {
          // Check for exact match (case-insensitive) since the backend 'startsWith' filter might return multiple
          const exactMatch = fetchedLoans.some(
            (l) =>
              l.loanTerms?.loanNumber?.toLowerCase() ===
              loanNumberValue.toLowerCase(),
          );

          if (exactMatch) {
            setError("loanNumber", {
              type: "manual",
              message: `Loan number ${loanNumberValue} already exists!`,
            });
          } else {
            clearErrors("loanNumber");
          }
        } else {
          clearErrors("loanNumber");
        }
      } catch (error) {
        console.error("Failed to verify loan number", error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [loanNumberValue, loan, loanType, setError, clearErrors]);

  const dateLoanDisbursed = watch("dateLoanDisbursed");

  const addMonths = (dateStr, months) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split("T")[0];
  };

  const addDays = (dateStr, days) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  };

  const addWeeks = (dateStr, weeks) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + weeks * 7);
    return date.toISOString().split("T")[0];
  };

  // Auto-calculate EMI start and end dates
  // End date uses (tenure - 1) periods from start to match generateEmiSchedule (0-indexed loop)
  useEffect(() => {
    if (dateLoanDisbursed) {
      let startDate = "";
      let endDate = "";

      if (loanType === "Daily") {
        startDate = addDays(dateLoanDisbursed, 1);
        setValue("emiStartDate", startDate, { shouldValidate: true });
        if (tenure && tenure > 0) {
          // Last EMI = startDate + (tenure - 1) days
          endDate = addDays(startDate, tenure - 1);
          setValue("emiEndDate", endDate, { shouldValidate: true });
        }
      } else if (loanType === "Weekly") {
        startDate = addWeeks(dateLoanDisbursed, 1);
        setValue("emiStartDate", startDate, { shouldValidate: true });
        if (tenure && tenure > 0) {
          // Last EMI = startDate + (tenure - 1) weeks
          endDate = addWeeks(startDate, tenure - 1);
          setValue("emiEndDate", endDate, { shouldValidate: true });
        }
      } else {
        // Monthly or Interest
        startDate = addMonths(dateLoanDisbursed, 1);
        setValue("emiStartDate", startDate, { shouldValidate: true });
        if (tenure && tenure > 0) {
          // Last EMI = startDate + (tenure - 1) months
          endDate = addMonths(startDate, tenure - 1);
          setValue("emiEndDate", endDate, { shouldValidate: true });
        }
      }
    }
  }, [dateLoanDisbursed, tenure, loanType, setValue]);

  // Auto-calculate EMI and other fields
  useEffect(() => {
    if (totalPrincipal && processingRate) {
      const fee = (totalPrincipal * processingRate) / 100;
      setProcessingFee(fee);
      setValue("processingFeeAmount", parseFloat(fee.toFixed(2)), {
        shouldValidate: true,
      });
    } else {
      const amount = watch("processingFeeAmount");
      if (totalPrincipal && amount) {
        const rate = (amount / totalPrincipal) * 100;
        setValue("processingFeeRate", parseFloat(rate.toFixed(2)), {
          shouldValidate: true,
        });
        setProcessingFee(amount);
      } else {
        setProcessingFee(0);
      }
    }

    if (totalPrincipal && tenure && interestRate) {
      let emi = 0;
      let interest = 0;

      if (
        loanType === "Daily" ||
        loanType === "Weekly" ||
        loanType === "Monthly"
      ) {
        const interestAmountPerPeriod = totalPrincipal * (interestRate / 100);
        interest = tenure * interestAmountPerPeriod;
        const totalAmount = totalPrincipal + interest;
        emi = Math.ceil(totalAmount / tenure);
      } else {
        const monthlyRate = interestRate / 100 / 12;
        emi =
          (totalPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
          (Math.pow(1 + monthlyRate, tenure) - 1);
        interest = emi * tenure - totalPrincipal;
      }

      setMonthlyEMI(emi || 0);
      setTotalInterest(interest || 0);
      setRemainingPrincipal(totalPrincipal || 0);
    } else {
      setMonthlyEMI(0);
      setTotalInterest(0);
      setRemainingPrincipal(0);
    }
  }, [totalPrincipal, processingRate, tenure, interestRate, loanType]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const routeType = (
        loan?.loanType ||
        defaultLoanType ||
        "Monthly"
      ).toLowerCase();
      const endpoint = `/${routeType}-loans`;

      const principal = Number(data.totalPrincipalAmount) || 0;
      const rate = Number(data.interestRate) || 0;
      const tenureVal = Number(data.tenure) || 1;
      const feeRate = Number(data.processingFeeRate) || 0;
      const feeAmount = Number(data.processingFeeAmount) || 0;
      const disbursedDate =
        data.dateLoanDisbursed || new Date().toISOString().split("T")[0];

      let startDate = data.emiStartDate;
      let endDate = data.emiEndDate;

      if (!startDate) {
        if (loanType === "Daily") {
          startDate = addDays(disbursedDate, 1);
        } else if (loanType === "Weekly") {
          startDate = addWeeks(disbursedDate, 1);
        } else {
          startDate = addMonths(disbursedDate, 1);
        }
      }

      if (!endDate) {
        if (loanType === "Daily") {
          endDate = addDays(startDate, tenureVal - 1);
        } else if (loanType === "Weekly") {
          endDate = addWeeks(startDate, tenureVal - 1);
        } else {
          endDate = addMonths(startDate, tenureVal - 1);
        }
      }

      const loanTermsData = {
        loanNumber: data.loanNumber,
        principalAmount: principal,
        annualInterestRate: rate,
        emiStartDate: startDate,
        emiEndDate: endDate,
        processingFeeRate: feeRate,
        processingFee: feeAmount,
        dateLoanDisbursed: disbursedDate,
      };

      if (loanType === "Weekly") {
        loanTermsData.tenureWeeks = tenureVal;
        loanTermsData.weeklyEMI = monthlyEMI || data.emiAmount || 0;
        loanTermsData.tenureMonths = tenureVal;
        loanTermsData.monthlyEMI = monthlyEMI || data.emiAmount || 0;
      } else if (loanType === "Daily") {
        loanTermsData.tenureDays = tenureVal;
        loanTermsData.dailyEMI = monthlyEMI || data.emiAmount || 0;
        loanTermsData.tenureMonths = tenureVal;
        loanTermsData.monthlyEMI = monthlyEMI || data.emiAmount || 0;
      } else if (loanType === "Interest") {
        loanTermsData.interestRate = rate;
        loanTermsData.monthlyInterest = monthlyEMI || data.emiAmount || 0;
        loanTermsData.interestStartDate = startDate;
      } else {
        loanTermsData.tenureMonths = tenureVal;
        loanTermsData.monthlyEMI = monthlyEMI || data.emiAmount || 0;
      }

      const payload = {
        customerDetails: {
          customerName: data.customerName || "Draft Customer",
          panNumber: data.panNumber || null,
          aadharNumber: data.aadharNumber || null,
          mobileNumbers: [
            data.primaryMobileNumber || "0000000000",
            ...(data.mobileNumbers?.map((m) => m.number) || []),
          ].filter(Boolean),
          address: data.currentAddress || data.customerAddress || "N/A",
          ownRent: data.ownRent || "Own",
          guarantorName: data.guarantorName || null,
          guarantorMobileNumbers: [
            data.primaryGuarantorMobile,
            ...(data.guarantorMobileNumbers?.map((m) => m.number) || []),
          ].filter(Boolean),
        },
        loanTerms: loanTermsData,
        vehicleInformation: {
          vehicleNumber: data.vehicleNumber || "N/A",
          typeOfVehicle: data.typeOfVehicle || "Unknown",
          modelYear: data.modelYear
            ? Number(data.modelYear)
            : new Date().getFullYear(),
          chassisNumber: data.chassisNumber || "",
          engineNumber: data.engineNumber || "",
          ywBoard: data.boardType || "Unknown",
          hpEntry: data.hpEntry || "Not Done",
          rtoWorkPending: data.rtoPending || [],
          dealerName: data.dealerName || "",
          dealerNumber: data.dealerNumber || "",
          fcDate: data.fcDate || null,
          insuranceDate: data.insuranceDate || null,
        },
        status: {
          status: data.status || "Active",
          remarks: data.remarks || "",
          clientResponse: data.remarks || "",
          nextFollowUpDate: data.followUpDate || null,
        },
      };

      if (loan) {
        // Edit existing loan
        const res = await apiClient.put(`${endpoint}/${loan.id}`, payload);
        if (res.status === "success" || res.success) {
          toast.success("Loan profile updated successfully!");
          window.location.reload();
        } else {
          throw new Error(res.message || "Failed to update loan");
        }
      } else {
        // Create new loan
        const res = await apiClient.post(endpoint, payload);
        if (res.status === "success" || res.success) {
          toast.success("Loan profile created successfully!");
          reset();
          router.refresh();
        } else {
          throw new Error(res.message || "Failed to create loan");
        }
      }
    } catch (error) {
      console.error(
        loan ? "Error updating loan:" : "Error creating loan:",
        error,
      );
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    "w-full h-[42px] rounded-lg border border-border-custom bg-slate-50/50 px-4 text-text-primary placeholder-[#9CA3AF] focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm";
  const textareaClasses =
    "w-full rounded-lg border border-border-custom bg-slate-50/50 px-4 py-2.5 text-text-primary placeholder-[#9CA3AF] focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm resize-none";
  const labelClasses =
    "text-xs font-bold text-text-primary uppercase tracking-wider mb-1.5 block";
  const cardClasses =
    "rounded-2xl border border-border-custom bg-card-background p-6 shadow-sm shadow-black/5 hover:shadow-md transition-shadow duration-200";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="pb-8">
      {/* Live Estimate Horizontal Widget */}
      {/* Live Estimate Horizontal Widget */}
      <div className="mb-6 rounded-2xl border border-border-custom bg-white p-4 shadow-sm shadow-black/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">
              Live Estimate
            </h3>
            <p className="text-[10px] text-neutral">
              Real-time calculated values
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
            <p className="text-[9px] font-extrabold text-primary/70 uppercase tracking-wider mb-1">
              {loanType === "Weekly"
                ? "Weekly EMI"
                : loanType === "Daily"
                  ? "Daily EMI"
                  : "Monthly EMI"}
            </p>
            <p className="font-extrabold text-primary text-base leading-tight truncate">
              {"₹" +
                monthlyEMI.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
          <div className="rounded-xl bg-background-custom border border-border-custom p-3">
            <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider mb-1">
              Principal
            </p>
            <p className="font-extrabold text-text-primary text-base leading-tight truncate">
              {"₹" +
                (totalPrincipal
                  ? Number(totalPrincipal).toLocaleString("en-IN")
                  : "0")}
            </p>
          </div>
          <div className="rounded-xl bg-background-custom border border-border-custom p-3">
            <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider mb-1">
              Interest
            </p>
            <p className="font-extrabold text-text-primary text-base leading-tight truncate">
              {"₹" +
                totalInterest.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
          <div className="rounded-xl bg-background-custom border border-border-custom p-3">
            <p className="text-[9px] font-extrabold text-text-secondary uppercase tracking-wider mb-1">
              Processing Fee
            </p>
            <p className="font-extrabold text-text-primary text-base leading-tight truncate">
              {"₹" +
                processingFee.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Left Columns (Col Span 2) - Customer & Vehicle Details */}
        <div className="space-y-8 lg:col-span-2">
          {/* System Information Section */}
          <div
            className={`${cardClasses} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">
                  System Information
                </h3>
                <p className="text-[10px] text-neutral">
                  Core operational and status settings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                Loan Status *
              </span>
              <select
                {...register("status")}
                className="rounded-lg border border-border-custom bg-background-custom px-3 py-1.5 text-text-primary focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/20 transition-all outline-none text-xs font-semibold min-w-[120px]"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Seized">Seized</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Customer Details Section */}
          <div className={cardClasses}>
            <div className="flex items-center gap-3 border-b border-border-custom pb-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  Customer Details
                </h2>
                <p className="text-xs text-neutral">
                  Personal identity, address, and contact numbers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
              {/* Row 1: Loan Number | Customer Name */}
              <div>
                <label className={labelClasses}>Loan Number *</label>
                <input
                  type="text"
                  {...register("loanNumber")}
                  placeholder="LN001"
                  readOnly={!!loan}
                  className={`${inputClasses} ${loan ? "bg-background-custom text-neutral cursor-not-allowed border-border-custom focus:ring-0 focus:border-border-custom" : ""}`}
                />
                {errors.loanNumber && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.loanNumber.message}
                  </span>
                )}
              </div>
              <div>
                <label className={labelClasses}>Customer Name</label>
                <input
                  type="text"
                  {...register("customerName")}
                  placeholder="Enter customer name"
                  className={inputClasses}
                />
                {errors.customerName && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.customerName.message}
                  </span>
                )}
              </div>

              {/* Row 2: PAN Number | Aadhar Number */}
              <div>
                <label className={labelClasses}>PAN Number</label>
                <input
                  type="text"
                  {...register("panNumber")}
                  placeholder="ABCDE1234F"
                  className={inputClasses}
                />
                {errors.panNumber && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.panNumber.message}
                  </span>
                )}
              </div>
              <div>
                <label className={labelClasses}>Aadhar Number</label>
                <input
                  type="text"
                  {...register("aadharNumber")}
                  placeholder="123456789012"
                  className={inputClasses}
                />
                {errors.aadharNumber && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.aadharNumber.message}
                  </span>
                )}
              </div>

              {/* Row 3: Ownership Status | (spacer on md) */}
              <div>
                <label className={labelClasses}>Ownership Status</label>
                <select {...register("ownRent")} className={inputClasses}>
                  <option value="Own">Own</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>

              {/* Row 4: Current Address - full width */}
              <div className="col-span-1 md:col-span-2">
                <label className={labelClasses}>Current Address</label>
                <textarea
                  {...register("currentAddress")}
                  placeholder="Enter full address"
                  className={`${textareaClasses} h-[100px]`}
                />
                {errors.currentAddress && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.currentAddress.message}
                  </span>
                )}
              </div>

              {/* Row 5: Mobile Numbers - full width */}
              <div className="col-span-1 md:col-span-2 space-y-3">
                <label className={labelClasses}>Mobile Numbers</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("primaryMobileNumber")}
                    placeholder="9876543210"
                    maxLength="10"
                    className={`${inputClasses} pl-10`}
                  />
                </div>
                {errors.primaryMobileNumber && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.primaryMobileNumber.message}
                  </span>
                )}

                {/* Extra Mobile Contacts */}
                {mobileFields.length > 0 && (
                  <div className="space-y-3 pt-1.5">
                    <label className={labelClasses}>
                      Extra Mobile Contacts
                    </label>
                    {mobileFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                            <Phone className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            {...register(`mobileNumbers.${index}.number`)}
                            placeholder="Enter mobile number"
                            maxLength="10"
                            className={`${inputClasses} pl-10`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMobile(index)}
                          className="rounded-lg bg-rose-50 px-3 text-rose-600 hover:bg-rose-100 transition-colors h-[42px] flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => appendMobile({ number: "" })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary uppercase transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Extra Contact
                </button>
              </div>

              {/* Section Divider separating Customer and Guarantor Details */}
              <div className="col-span-1 md:col-span-2 border-t border-border-custom my-2"></div>

              {/* Row 5: Guarantor Name | Guarantor Mobile Numbers */}
              <div>
                <label className={labelClasses}>Guarantor Name</label>
                <input
                  type="text"
                  {...register("guarantorName")}
                  placeholder="Enter Guarantor Name"
                  className={inputClasses}
                />
                {errors.guarantorName && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.guarantorName.message}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <label className={labelClasses}>Guarantor Mobile Numbers</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("primaryGuarantorMobile")}
                    placeholder="Primary Guarantor Mobile"
                    maxLength="10"
                    className={`${inputClasses} pl-10`}
                  />
                </div>
                {errors.primaryGuarantorMobile && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.primaryGuarantorMobile.message}
                  </span>
                )}

                {/* Extra Guarantor Contacts */}
                {guarantorFields.length > 0 && (
                  <div className="space-y-3 pt-1.5">
                    <label className={labelClasses}>
                      Extra Guarantor Contacts
                    </label>
                    {guarantorFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                            <Phone className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            {...register(
                              `guarantorMobileNumbers.${index}.number`,
                            )}
                            placeholder="Enter guarantor mobile"
                            maxLength="10"
                            className={`${inputClasses} pl-10`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGuarantor(index)}
                          className="rounded-lg bg-danger/10 px-3 text-danger hover:bg-danger/20 transition-colors h-[42px] flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => appendGuarantor({ number: "" })}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary uppercase transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Guarantor Contact
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Information Section - Only show for non-Daily/Weekly loans */}
          {loanType !== "Daily" && loanType !== "Weekly" && (
            <div className={cardClasses}>
              <div className="flex items-center gap-3 border-b border-border-custom pb-4 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    Vehicle Information
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Registration details, model specifications, and dealer info
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Row 1: Vehicle Number | Chassis Number */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClasses}>Vehicle Number</label>
                    <input
                      type="text"
                      {...register("vehicleNumber")}
                      placeholder="DL-01-AB-1234"
                      readOnly={!!loan}
                      className={`${inputClasses} ${loan ? "bg-background-custom text-neutral cursor-not-allowed border-border-custom focus:ring-0 focus:border-border-custom" : ""}`}
                    />
                    {errors.vehicleNumber && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.vehicleNumber.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClasses}>Chassis Number</label>
                    <input
                      type="text"
                      {...register("chassisNumber")}
                      placeholder="MHBBC123456"
                      className={inputClasses}
                    />
                    {errors.chassisNumber && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.chassisNumber.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Engine Number | Model Year */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClasses}>Engine Number</label>
                    <input
                      type="text"
                      {...register("engineNumber")}
                      placeholder="MA654321"
                      className={inputClasses}
                    />
                    {errors.engineNumber && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.engineNumber.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClasses}>Model Year</label>
                    <input
                      type="number"
                      {...register("modelYear", { valueAsNumber: true })}
                      placeholder="2024"
                      className={inputClasses}
                    />
                    {errors.modelYear && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.modelYear.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Vehicle Type | Board Type */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClasses}>Vehicle Type</label>
                    <select
                      {...register("typeOfVehicle")}
                      className={inputClasses}
                    >
                      <option value="2-Wheeler">2-Wheeler</option>
                      <option value="3-Wheeler">3-Wheeler</option>
                      <option value="4-Wheeler">4-Wheeler</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Board Type</label>
                    <select {...register("boardType")} className={inputClasses}>
                      <option value="Yellow">Yellow (Commercial)</option>
                      <option value="White">White (Private)</option>
                    </select>
                  </div>
                </div>

                {/* Dealer Information */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-border-custom">
                  <div>
                    <label className={labelClasses}>Dealer Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                        <Building className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        {...register("dealerName")}
                        placeholder="Enter dealership name"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                    {errors.dealerName && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.dealerName.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClasses}>Dealer Contact</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                        <Phone className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        {...register("dealerNumber")}
                        placeholder="Dealer mobile"
                        maxLength="10"
                        className={`${inputClasses} pl-10`}
                      />
                    </div>
                    {errors.dealerNumber && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.dealerNumber.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Document/Important Dates */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-border-custom">
                  <div>
                    <label className={labelClasses}>FC Expiry Date</label>
                    <input
                      type="date"
                      {...register("fcDate")}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>
                      Insurance Expiry Date
                    </label>
                    <input
                      type="date"
                      {...register("insuranceDate")}
                      className={inputClasses}
                    />
                  </div>
                </div>

                {/* HP Entry & RTO Status */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-4 border-t border-border-custom">
                  <div>
                    <label className={labelClasses}>HP Entry</label>
                    <select {...register("hpEntry")} className={inputClasses}>
                      <option value="Applied">Applied</option>
                      <option value="Not Done">Not Done</option>
                      <option value="Finished">Finished</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>
                      RTO Work Pending Checklist
                    </label>
                    <div className="space-y-3">
                      {/* Custom Dropdown with built-in custom entry */}
                      <div className="relative" ref={rtoDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setRtoDropdownOpen(!rtoDropdownOpen)}
                          className={`${inputClasses} text-left flex items-center justify-between cursor-pointer`}
                        >
                          <span
                            className={
                              rtoPendingList.length > 0
                                ? "text-text-primary"
                                : "text-neutral"
                            }
                          >
                            {rtoPendingList.length > 0
                              ? `${rtoPendingList.length} task(s) selected`
                              : "-- Select RTO tasks --"}
                          </span>
                          <svg
                            className={`h-4 w-4 text-neutral transition-transform ${rtoDropdownOpen ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {rtoDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-border-custom bg-white shadow-xl shadow-black/5 overflow-hidden">
                            {/* Scrollable option list */}
                            <div className="max-h-52 overflow-y-auto">
                              {[
                                "DL",
                                "DL Badge",
                                "Fresh Permit",
                                "HPA",
                                "HPT",
                                "Insurance \u2013 1st Party",
                                "Insurance \u2013 3rd Party",
                                "NOC",
                                "PP",
                                "Permit Renewal",
                                "TO (Name Transfer)",
                              ].map((option) => {
                                const isSelected =
                                  rtoPendingList.includes(option);
                                return (
                                  <button
                                    type="button"
                                    key={option}
                                    onClick={() => {
                                      if (isSelected) {
                                        handleRemoveRtoTask(option);
                                      } else {
                                        handleAddRtoTask(option);
                                      }
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors text-left ${
                                      isSelected
                                        ? "bg-primary/10 text-primary"
                                        : "text-text-primary hover:bg-background-custom"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                                        isSelected
                                          ? "border-primary bg-primary text-white"
                                          : "border-border-custom"
                                      }`}
                                    >
                                      {isSelected && (
                                        <CheckCircle2 className="h-3 w-3" />
                                      )}
                                    </span>
                                    {option}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Divider + Custom task entry inside dropdown */}
                            <div className="border-t border-border-custom p-3">
                              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">
                                Custom RTO Task
                              </span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customRtoTask}
                                  onChange={(e) =>
                                    setCustomRtoTask(e.target.value)
                                  }
                                  placeholder="Task name..."
                                  className="flex-1 rounded-lg border border-border-custom bg-background-custom px-3 py-2 text-xs text-text-primary placeholder-neutral focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (customRtoTask.trim()) {
                                        handleAddRtoTask(customRtoTask);
                                        setCustomRtoTask("");
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customRtoTask.trim()) {
                                      handleAddRtoTask(customRtoTask);
                                      setCustomRtoTask("");
                                    }
                                  }}
                                  className="rounded-lg bg-primary px-3 py-2 text-[10px] font-bold text-white hover:bg-secondary active:scale-95 transition-all"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active Pending List (shown below the dropdown) */}
                      {rtoPendingList.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                            Pending Tasks ({rtoPendingList.length})
                          </span>
                          <div className="grid gap-2">
                            {rtoPendingList.map((task) => (
                              <div
                                key={task}
                                className="flex items-center justify-between rounded-lg border border-border-custom bg-slate-50/50 px-3 py-2 text-xs font-semibold text-text-primary hover:bg-background-custom transition-colors"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                                  {task}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRtoTask(task)}
                                  className="rounded bg-[var(--color-success-bg)] px-2.5 py-1 text-[10px] font-bold text-success border border-[var(--color-success)]/10 hover:opacity-90 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Done
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8 lg:col-span-1">
          {/* Loan Terms (monthly) Section */}
          <div className={cardClasses}>
            <div className="flex items-center gap-3 border-b border-border-custom pb-4 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-success-bg)] text-success">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">
                  Loan Terms (
                  {loanType === "Weekly"
                    ? "Weekly"
                    : loanType === "Daily"
                      ? "Daily"
                      : "Monthly"}
                  )
                </h3>
                <p className="text-[10px] text-text-secondary">
                  Principal, rates, duration, and disbursement settings
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Update Payment Button & Info */}
              <div className="pb-4 border-b border-border-custom mb-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentPayments = watch("payments") || [
                      {
                        date: new Date().toISOString().split("T")[0],
                        mode: "Cash",
                        amount: 0,
                      },
                    ];
                    const grouped = [];
                    currentPayments.forEach((p) => {
                      let group = grouped.find((g) => g.date === p.date);
                      if (!group) {
                        group = { date: p.date, entries: [] };
                        grouped.push(group);
                      }
                      group.entries.push({ mode: p.mode || "Cash", amount: Number(p.amount) || 0 });
                    });
                    setTempPayments(grouped);
                    setShowPaymentModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-primary hover:bg-primary/20 hover:border-primary/30 font-bold text-sm transition-all shadow-sm active:scale-[0.99]"
                >
                  <CreditCard className="h-4 w-4" /> Update Payment
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelClasses} style={{ marginBottom: 0 }}>
                    Total Principal
                  </label>
                  <span className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Calculated
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    {...register("totalPrincipalAmount", {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    readOnly
                    className={`${inputClasses} pl-7 bg-slate-100 cursor-not-allowed font-semibold text-text-secondary border-border-custom`}
                  />
                </div>
                {errors.totalPrincipalAmount && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.totalPrincipalAmount.message}
                  </span>
                )}
              </div>

              <div>
                <label className={labelClasses}>Interest Rate (%)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                    <Percent className="h-4 w-4" />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    {...register("interestRate", { valueAsNumber: true })}
                    placeholder="8.5"
                    className={`${inputClasses} pl-10`}
                  />
                </div>
                {errors.interestRate && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.interestRate.message}
                  </span>
                )}
              </div>

              <div>
                <label className={labelClasses}>
                  Tenure (
                  {loanType === "Weekly"
                    ? "Weeks"
                    : loanType === "Daily"
                      ? "Days"
                      : "Months"}
                  )
                </label>
                <input
                  type="number"
                  {...register("tenure", { valueAsNumber: true })}
                  placeholder="60"
                  className={inputClasses}
                />
                {errors.tenure && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.tenure.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClasses}>
                    Processing Fee Rate (%)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral">
                      <Percent className="h-4 w-4" />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("processingFeeRate", {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const rate = parseFloat(e.target.value);
                          if (!isNaN(rate) && totalPrincipal) {
                            const amount = (totalPrincipal * rate) / 100;
                            setValue(
                              "processingFeeAmount",
                              parseFloat(amount.toFixed(2)),
                              { shouldValidate: true },
                            );
                            setProcessingFee(amount);
                          } else if (e.target.value === "") {
                            setValue("processingFeeAmount", "", {
                              shouldValidate: true,
                            });
                            setProcessingFee(0);
                          }
                        },
                      })}
                      placeholder="2.5"
                      className={`${inputClasses} pl-10`}
                    />
                  </div>
                  {errors.processingFeeRate && (
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.processingFeeRate.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className={labelClasses}>
                    Processing Fee Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("processingFeeAmount", {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const amount = parseFloat(e.target.value);
                          if (
                            !isNaN(amount) &&
                            totalPrincipal &&
                            totalPrincipal > 0
                          ) {
                            const rate = (amount / totalPrincipal) * 100;
                            setValue(
                              "processingFeeRate",
                              parseFloat(rate.toFixed(2)),
                              { shouldValidate: true },
                            );
                            setProcessingFee(amount);
                          } else if (e.target.value === "") {
                            setValue("processingFeeRate", "", {
                              shouldValidate: true,
                            });
                            setProcessingFee(0);
                          }
                        },
                      })}
                      placeholder="100.00"
                      className={`${inputClasses} pl-7`}
                    />
                  </div>
                  {errors.processingFeeAmount && (
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.processingFeeAmount.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Dates & Disbursal */}
          <div className={cardClasses}>
            <div className="flex items-center gap-3 border-b border-border-custom pb-4 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger/10 text-danger">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">
                  Timeline & Schedule
                </h3>
                <p className="text-[10px] text-text-secondary">
                  Important dates and schedules
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Date Disbursed</label>
                <input
                  type="date"
                  {...register("dateLoanDisbursed")}
                  className={inputClasses}
                />
                {errors.dateLoanDisbursed && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.dateLoanDisbursed.message}
                  </span>
                )}
              </div>

              <div>
                <label className={labelClasses}>EMI Start Date</label>
                <input
                  type="date"
                  {...register("emiStartDate")}
                  className={inputClasses}
                />
                {errors.emiStartDate && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.emiStartDate.message}
                  </span>
                )}
              </div>

              <div>
                <label className={labelClasses}>EMI End Date</label>
                <input
                  type="date"
                  {...register("emiEndDate")}
                  className={inputClasses}
                />
                {errors.emiEndDate && (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.emiEndDate.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status Update (Client Response) */}
          <div className="rounded-2xl border border-accent bg-secondary text-white shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between border-b border-accent bg-accent/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-warning">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Status Update (Client Response)
                  </h3>
                  <p className="text-[11px] text-white/70 font-semibold mt-0.5">
                    Follow-up date, client response log, and notes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setValue("followUpDate", "");
                  setValue("remarks", "");
                }}
                className="inline-flex items-center gap-1 rounded bg-danger/80 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-danger transition-all cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Follow-up Date (Client Response)
                </label>
                <input
                  type="date"
                  {...register("followUpDate")}
                  className="w-full rounded-xl border border-accent bg-accent/50 px-3 py-2 text-sm text-white/95 focus:border-warning focus:ring-2 focus:ring-warning/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-2">
                  Client Response / Remarks
                </label>
                <textarea
                  {...register("remarks")}
                  placeholder="Enter any additional remarks or notes..."
                  rows="4"
                  className="w-full rounded-xl border border-accent bg-accent/50 px-3 py-2 text-sm text-white/95 focus:border-warning focus:ring-2 focus:ring-warning/20 outline-none transition-all resize-none"
                />
              </div>

              {loan && (
                <div className="mt-3 pt-3 border-t border-accent/30 flex flex-wrap gap-4 text-[10px] font-bold text-white/60">
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="mt-8 flex justify-between items-center border-t border-border-custom pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-border-custom bg-white px-6 py-2.5 text-sm font-semibold text-primary hover:bg-background-custom active:bg-slate-100 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            backgroundColor: isSubmitting ? "#B0B4C1" : "var(--color-primary)",
          }}
          className="rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-secondary active:scale-[0.98] transition-all disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? loan
              ? "Updating Profile..."
              : "Creating Profile..."
            : loan
              ? "Update Profile"
              : "Create Profile"}
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-border-custom flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-custom px-6 py-4">
              <h3 className="font-bold text-text-primary text-lg">
                Disbursement Details
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto space-y-4 flex-1">
              {tempPayments.map((group, gIndex) => (
                <div
                  key={gIndex}
                  className="p-4 rounded-xl border border-border-custom bg-background-custom space-y-4 relative group"
                >
                  {/* Remove Group Button */}
                  {tempPayments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = tempPayments.filter((_, idx) => idx !== gIndex);
                        setTempPayments(updated);
                      }}
                      className="absolute top-2.5 right-2.5 text-neutral hover:text-danger transition-colors p-1 rounded hover:bg-white border border-transparent hover:border-border-custom"
                      title="Remove Group"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Payment Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        Payment Date
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...tempPayments];
                          updated[gIndex].date = "";
                          setTempPayments(updated);
                        }}
                        className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 transition-colors uppercase"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="date"
                      value={group.date || ""}
                      onChange={(e) => {
                        const updated = [...tempPayments];
                        updated[gIndex].date = e.target.value;
                        setTempPayments(updated);
                      }}
                      className="w-full max-w-[200px] rounded-lg border border-border-custom bg-white px-3 py-2 text-text-primary text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>

                  {/* Entries */}
                  <div className="space-y-3">
                    {group.entries.map((entry, eIndex) => (
                      <div key={eIndex} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        {/* Mode */}
                        <div>
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                            Mode
                          </label>
                          <select
                            value={entry.mode || "Cash"}
                            onChange={(e) => {
                              const updated = [...tempPayments];
                              updated[gIndex].entries[eIndex].mode = e.target.value;
                              setTempPayments(updated);
                            }}
                            className="w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-text-primary text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>

                        {/* Amount */}
                        <div>
                          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1 block">
                            Amount
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral text-xs font-semibold">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={entry.amount === 0 ? "" : entry.amount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                const updated = [...tempPayments];
                                updated[gIndex].entries[eIndex].amount = isNaN(val) ? 0 : val;
                                setTempPayments(updated);
                              }}
                              placeholder="0.00"
                              className="w-full rounded-lg border border-border-custom bg-white pl-6 pr-3 py-2 text-text-primary text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                            />
                          </div>
                        </div>

                        {/* Remove Entry Button */}
                        {group.entries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...tempPayments];
                              updated[gIndex].entries.splice(eIndex, 1);
                              setTempPayments(updated);
                            }}
                            className="mb-1 h-9 w-9 flex items-center justify-center text-neutral hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        {group.entries.length <= 1 && (
                          <div className="w-9 h-9"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add More button inside the card */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...tempPayments];
                        updated[gIndex].entries.push({ mode: "Cash", amount: 0 });
                        setTempPayments(updated);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-secondary uppercase transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add More
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Date outside */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const localDate = new Date();
                    const year = localDate.getFullYear();
                    const month = String(localDate.getMonth() + 1).padStart(2, "0");
                    const day = String(localDate.getDate()).padStart(2, "0");
                    const dateStr = `${year}-${month}-${day}`;
                    setTempPayments([
                      ...tempPayments,
                      { date: dateStr, entries: [{ mode: "Cash", amount: 0 }] },
                    ]);
                  }}
                  className="w-full py-3 border border-dashed border-border-custom rounded-xl text-xs font-bold text-text-secondary hover:bg-background-custom hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5 uppercase"
                >
                  <Plus className="h-3.5 w-3.5" /> Add New Date
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border-custom px-6 py-4 bg-background-custom flex items-center justify-between shrink-0">
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Total Amount
                </p>
                <p className="text-lg font-bold text-text-primary">
                  {"₹" +
                    tempPayments
                      .reduce(
                        (sum, g) => sum + g.entries.reduce((s, e) => s + (Number(e.amount) || 0), 0),
                        0
                      )
                      .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-custom bg-white text-xs font-semibold text-primary hover:bg-background-custom transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const flatPayments = [];
                    tempPayments.forEach(g => {
                      g.entries.forEach(e => {
                        flatPayments.push({ date: g.date, mode: e.mode, amount: e.amount });
                      });
                    });
                    setValue("payments", flatPayments);
                    setShowPaymentModal(false);
                  }}
                  className="px-5 py-2 rounded-lg bg-primary text-xs font-semibold text-white hover:bg-secondary shadow-sm shadow-black/5 active:scale-[0.98] transition-all"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
