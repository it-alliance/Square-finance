'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import TableFilters from '@/components/tables/TableFilters';
import { mockLoans } from '@/mock/loans';
import { formatCurrency, formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE, LOAN_STATUSES } from '@/utils/constants';
import { Eye, Edit2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';

export default function LoansPageTemplate({ loanType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState(null);
  
  // Filter mock loans for this specific page type
  const [loansList, setLoansList] = useState(() => 
    mockLoans.filter((loan) => loan.loanType === loanType)
  );

  const routePrefix = `/${loanType.toLowerCase()}-loans`;

  // Filter and search
  const filteredData = useMemo(() => {
    let data = searchFilter(loansList, searchTerm, [
      'loanNumber',
      'customerName',
      'vehicleNumber',
    ]);

    if (activeFilters.status) {
      data = data.filter((item) => item.status === activeFilters.status);
    }

    return data;
  }, [searchTerm, activeFilters, loansList]);

  const handleDeleteLoan = (id) => {
    confirmToast('Are you sure you want to delete this loan?', () => {
      setLoansList((prev) => prev.filter((loan) => loan.id !== id));
      toast.success('Loan deleted successfully!');
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
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

  const columns = [
    { key: 'loanNumber', label: 'Loan Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'vehicleNumber', label: 'Vehicle Number' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'loanAmount',
      label: 'Disbursement',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'emiAmount',
      label: 'EMI',
      render: (value) => formatCurrency(value),
    },
    { key: 'tenure', label: 'Tenure' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    { key: 'clientResponse', label: 'Client Response' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Link
            href={`${routePrefix}/${row.id}`}
            className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Link
            href={`${routePrefix}/${row.id}/edit`}
            className="rounded-lg bg-[var(--color-success-bg)] p-2 text-success hover:bg-success/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </Link>
          <button
            onClick={() => handleDeleteLoan(row.id)}
            className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${loanType} Loans`}
        description={`Manage all active and closed ${loanType.toLowerCase()} loans`}
      >
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary transition-all hover:bg-background-custom"
          >
            Export
          </button>
          <Link
            href={`${routePrefix}/create`}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white bg-primary hover:bg-secondary transition-all shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Create New Loan
          </Link>
        </div>
      </PageHeader>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by loan number, customer name, or vehicle..."
          />
          <TableFilters
            filters={[
              {
                key: 'status',
                label: 'Filter by Status',
                options: LOAN_STATUSES,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
        <p className="text-sm text-gray-600">
          Showing {paginatedData.length} of {filteredData.length} loans
        </p>
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

      {/* Loan Detail Modal (fallback) */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setSelectedLoan(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold">Loan Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Loan Number</p>
                <p className="font-medium">{selectedLoan.loanNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium">{selectedLoan.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vehicle Number</p>
                <p className="font-medium">{selectedLoan.vehicleNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Loan Amount</p>
                <p className="font-medium">
                  {formatCurrency(selectedLoan.loanAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">EMI Amount</p>
                <p className="font-medium">
                  {formatCurrency(selectedLoan.emiAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-medium">{formatDate(selectedLoan.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedLoan.status} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedLoan(null)}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
