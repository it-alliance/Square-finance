'use client';

import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatting';

// Rich Mock Data for Collections Report
const mockCollectionsData = [
  {
    loanNo: 'LN001',
    emiNo: '12',
    customerName: 'Raj Kumar',
    emiPaid: 12500,
    overdue: 0,
    total: 12500,
    type: 'Monthly',
    paymentMode: 'Cash',
    date: '2026-06-08',
    collector: 'Admin User'
  },
  {
    loanNo: 'LN002',
    emiNo: '8',
    customerName: 'Priya Singh',
    emiPaid: 18750,
    overdue: 1250,
    total: 20000,
    type: 'Monthly',
    paymentMode: 'Bank Transfer',
    date: '2026-06-07',
    collector: 'Collections Officer'
  },
  {
    loanNo: 'LN003',
    emiNo: '24',
    customerName: 'Amit Patel',
    emiPaid: 15000,
    overdue: 0,
    total: 15000,
    type: 'Weekly',
    paymentMode: 'UPI',
    date: '2026-06-06',
    collector: 'Collections Officer'
  },
  {
    loanNo: 'LN006',
    emiNo: '4',
    customerName: 'Divya Sharma',
    emiPaid: 13750,
    overdue: 0,
    total: 13750,
    type: 'Daily',
    paymentMode: 'Cash',
    date: '2026-06-05',
    collector: 'Admin User'
  },
  {
    loanNo: 'LN007',
    emiNo: '15',
    customerName: 'Vikram Singh',
    emiPaid: 17500,
    overdue: 5000,
    total: 22500,
    type: 'Interest',
    paymentMode: 'UPI',
    date: '2026-06-04',
    collector: 'Collections Officer'
  }
];

const mockLoansGivenData = [
  {
    loanNo: 'LN001',
    customerName: 'Raj Kumar',
    amount: 500000,
    type: 'Monthly',
    date: '2026-06-08',
    collector: 'Admin User'
  },
  {
    loanNo: 'LN002',
    customerName: 'Priya Singh',
    amount: 750000,
    type: 'Monthly',
    date: '2026-06-07',
    collector: 'Collections Officer'
  }
];

const mockExpensesData = [
  {
    expenseNo: 'EXP001',
    name: 'Office Rent',
    amount: 50000,
    category: 'Office',
    date: '2026-06-08',
    collector: 'Admin User'
  },
  {
    expenseNo: 'EXP003',
    name: 'Vehicle Maintenance',
    amount: 12000,
    category: 'Maintenance',
    date: '2026-06-05',
    collector: 'Admin User'
  }
];

export default function CollectionsReportPage() {
  const [activeTab, setActiveTab] = useState('collections'); // 'collections', 'loans', 'expenses'
  
  // Set default dates to 2026-06-09 (matching system local time and reference screenshot)
  const [startDate, setStartDate] = useState('2026-06-09');
  const [endDate, setEndDate] = useState('2026-06-09');
  
  const [filterRange, setFilterRange] = useState({
    start: '2026-06-09',
    end: '2026-06-09'
  });

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setFilterRange({
      start: startDate,
      end: endDate
    });
  };

  // Filter Data based on date range (start & end)
  const currentTabRecords = useMemo(() => {
    const isWithinRange = (dateStr) => {
      if (!dateStr) return false;
      return dateStr >= filterRange.start && dateStr <= filterRange.end;
    };

    if (activeTab === 'collections') {
      return mockCollectionsData.filter(item => isWithinRange(item.date));
    } else if (activeTab === 'loans') {
      return mockLoansGivenData.filter(item => isWithinRange(item.date));
    } else if (activeTab === 'expenses') {
      return mockExpensesData.filter(item => isWithinRange(item.date));
    }
    return [];
  }, [activeTab, filterRange]);

  // Calculate Total Collection
  const totalCollectionValue = useMemo(() => {
    // Show total for all matching collections in the view, or 0 if empty/no match
    if (activeTab === 'collections') {
      return currentTabRecords.reduce((sum, item) => sum + item.total, 0);
    }
    // Default total collections overall for reference or specific selected range
    return 0;
  }, [activeTab, currentTabRecords]);

  return (
    <div className="space-y-6">
      
      {/* Top Section */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        {/* Left Side */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Financial Reports
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-neutral/80">
            COLLECTIONS, DISBURSEMENTS & EXPENSES
          </p>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-56 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral">
            TOTAL COLLECTION
          </p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">
            {formatCurrency(totalCollectionValue)}
          </p>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="max-w-md rounded-2xl bg-gray-100/80 p-1">
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setActiveTab('collections')}
            className={`rounded-xl py-2.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'collections'
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral hover:text-primary'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`rounded-xl py-2.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'loans'
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral hover:text-primary'
            }`}
          >
            Loans Given
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`rounded-xl py-2.5 text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'expenses'
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral hover:text-primary'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleFilterSubmit} className="flex flex-col gap-6 md:flex-row md:items-end">
          
          {/* Start Date */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral">
              START DATE
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral">
              END DATE
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="w-full md:w-auto">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#111827] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all duration-200 active:scale-[0.98] h-[46px]"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </div>

      {/* Table Section */}
      <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            
            {/* Header */}
            <thead className="bg-[#F8FAFC] border-b border-gray-100">
              {activeTab === 'collections' && (
                <tr>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">LOAN NO</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">EMI NO</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">CUSTOMER NAME</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">EMI PAID</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">OVERDUE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">TOTAL</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">TYPE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">PAYMENT MODE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">DATE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">COLLECTOR</th>
                </tr>
              )}
              {activeTab === 'loans' && (
                <tr>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">LOAN NO</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">CUSTOMER NAME</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">AMOUNT</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">TYPE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">DATE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">COLLECTOR</th>
                </tr>
              )}
              {activeTab === 'expenses' && (
                <tr>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">EXPENSE NO</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">NAME</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">AMOUNT</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">CATEGORY</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">DATE</th>
                  <th className="px-6 py-4 font-extrabold tracking-wider text-neutral/80 uppercase">COLLECTOR</th>
                </tr>
              )}
            </thead>

            {/* Body */}
            <tbody>
              {currentTabRecords.length > 0 ? (
                currentTabRecords.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    {activeTab === 'collections' && (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.loanNo}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.emiNo}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.customerName}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">{formatCurrency(row.emiPaid)}</td>
                        <td className={`px-6 py-4 font-medium ${row.overdue > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                          {row.overdue > 0 ? formatCurrency(row.overdue) : '₹0'}
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">{formatCurrency(row.total)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.type}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">{formatDate(row.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.collector}</td>
                      </>
                    )}
                    {activeTab === 'loans' && (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.loanNo}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.customerName}</td>
                        <td className="px-6 py-4 font-bold text-primary">{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.type}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{formatDate(row.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.collector}</td>
                      </>
                    )}
                    {activeTab === 'expenses' && (
                      <>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.expenseNo}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{row.name}</td>
                        <td className="px-6 py-4 font-bold text-rose-600">{formatCurrency(row.amount)}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-600">{formatDate(row.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{row.collector}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td
                    colSpan={activeTab === 'collections' ? 10 : 6}
                    className="py-16 text-center"
                  >
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#94A3B8]/90 uppercase">
                      NO TRANSACTIONS FOUND FOR THIS PERIOD
                    </p>
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
