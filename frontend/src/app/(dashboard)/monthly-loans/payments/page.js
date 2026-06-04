'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import {
  mockPendingPayments,
  mockPartialPayments,
  mockFollowUps,
  mockForeclosure,
} from '@/mock/payments';
import { formatCurrency, formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE } from '@/utils/constants';
import { CheckCircle, AlertCircle, Clock, CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = [
    {
      id: 'pending',
      label: 'Pending Payments',
      icon: AlertCircle,
      data: mockPendingPayments,
    },
    {
      id: 'partial',
      label: 'Partial Payments',
      icon: Clock,
      data: mockPartialPayments,
    },
    {
      id: 'followup',
      label: 'Follow-ups',
      icon: Clock,
      data: mockFollowUps,
    },
    {
      id: 'foreclosure',
      label: 'Foreclosure',
      icon: CreditCard,
      data: mockForeclosure,
    },
  ];

  const currentTabData = tabs.find((tab) => tab.id === activeTab)?.data || [];

  const filteredData = useMemo(() => {
    return searchFilter(currentTabData, searchTerm, [
      'loanNumber',
      'customerName',
    ]);
  }, [searchTerm, activeTab, currentTabData]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Column definitions for each tab
  const columnsByTab = {
    pending: [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      {
        key: 'dueAmount',
        label: 'Due Amount',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'dueDate',
        label: 'Due Date',
        render: (value) => formatDate(value),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: () => (
          <button className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
            Collect
          </button>
        ),
      },
    ],
    partial: [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'paidAmount',
        label: 'Paid Amount',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'balanceAmount',
        label: 'Balance',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: () => (
          <button className="rounded-lg bg-[var(--color-success-bg)] px-3 py-1 text-sm font-medium text-success hover:bg-success/20 transition-colors">
            Collect Balance
          </button>
        ),
      },
    ],
    followup: [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      {
        key: 'lastFollowUpDate',
        label: 'Last Follow-up',
        render: (value) => formatDate(value),
      },
      {
        key: 'nextFollowUpDate',
        label: 'Next Follow-up',
        render: (value) => formatDate(value),
      },
      { key: 'remarks', label: 'Remarks' },
      {
        key: 'actions',
        label: 'Actions',
        render: () => (
          <button className="rounded-lg bg-[var(--color-warning-bg)] px-3 py-1 text-sm font-medium text-warning hover:bg-warning/20 transition-colors">
            Update
          </button>
        ),
      },
    ],
    foreclosure: [
      { key: 'loanNumber', label: 'Loan Number' },
      { key: 'customerName', label: 'Customer Name' },
      {
        key: 'outstandingAmount',
        label: 'Outstanding',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'settlementAmount',
        label: 'Settlement',
        render: (value) => formatCurrency(value),
      },
      {
        key: 'status',
        label: 'Status',
        render: (value) => <StatusBadge status={value} />,
      },
      {
        key: 'actions',
        label: 'Actions',
        render: () => (
          <button className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors">
            Details
          </button>
        ),
      },
    ],
  };

  const columns = columnsByTab[activeTab] || [];

  return (
    <>
      <PageHeader
        title="Payments Management"
        description="Track and manage all payment-related activities"
      />

      {/* Tabs */}
      <div className="mb-6 rounded-lg bg-white shadow">
        <div className="flex flex-wrap border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
                <span className="ml-2 rounded-full bg-background-custom px-2.5 py-0.5 text-xs font-semibold text-text-primary border border-border-custom">
                  {tab.data.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="space-y-4 p-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by loan number or customer name..."
          />
          <p className="text-sm text-gray-600">
            Showing {paginatedData.length} of {filteredData.length} records
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow">
        <DataTable columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}
