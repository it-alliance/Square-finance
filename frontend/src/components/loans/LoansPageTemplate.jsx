'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import TableFilters from '@/components/tables/TableFilters';
import { formatCurrency, formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE, LOAN_STATUSES } from '@/utils/constants';
import { Eye, Edit2, Plus, Trash2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';
import { apiClient } from '@/utils/apiClient';

export default function LoansPageTemplate({ loanType }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);
  
  const [loansList, setLoansList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const endpoint = `/${loanType.toLowerCase()}-loans?limit=1000`;
        const response = await apiClient.get(endpoint);
        if (response.status === 'success') {
          const fetchedLoans = response.data?.data || response.data || [];
          const loansArray = Array.isArray(fetchedLoans) ? fetchedLoans : [];
          const normalizedLoans = loansArray.map(loan => {
             const type = loan.loanType || loanType;
             const principal = Number(loan.loanTerms?.principalAmount || loan.loanAmount || 0);
             const rate = Number(loan.loanTerms?.annualInterestRate || loan.interestRate || 0);
             const tenureVal = Number(loan.loanTerms?.tenureMonths || loan.tenure || 1);

             let emi = Number(loan.loanTerms?.monthlyEMI || loan.emiAmount || 0);
             if (type === 'Daily' || type === 'Weekly' || type === 'Monthly') {
               const interestAmountPerPeriod = principal * (rate / 100);
               const totalInterest = tenureVal * interestAmountPerPeriod;
               emi = Math.ceil((principal + totalInterest) / tenureVal);
             }

             return {
               id: loan.id,
               loanNumber: loan.loanTerms?.loanNumber || loan.loanNumber,
               customerName: loan.customerDetails?.customerName || loan.customerName,
               vehicleNumber: loan.vehicleInformation?.vehicleNumber || loan.vehicleNumber,
               mobile: loan.customerDetails?.mobileNumbers?.[0] || loan.mobile || '',
               loanAmount: principal,
               emiAmount: emi,
               tenure: tenureVal,
               status: loan.status?.status || loan.status,
               clientResponse: loan.status?.clientResponse || loan.clientResponse || ''
             };
          });
          setLoansList(normalizedLoans);
        }
      } catch (error) {
        toast.error(`Failed to fetch ${loanType} loans`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLoans();
  }, [loanType]);

  const routePrefix = `/${loanType.toLowerCase()}-loans`;

  // Filter and search
  const filteredData = useMemo(() => {
    const searchKeys = ['loanNumber', 'customerName'];
    if (loanType !== 'Daily' && loanType !== 'Weekly') {
      searchKeys.push('vehicleNumber');
    }
    let data = searchFilter(loansList, searchTerm, searchKeys);

    if (activeFilters.status) {
      data = data.filter((item) => item.status === activeFilters.status);
    }

    return data;
  }, [searchTerm, activeFilters, loansList]);

  const handleDeleteLoan = (id) => {
    confirmToast('Are you sure you want to delete this loan?', async () => {
      try {
        const endpoint = `/${loanType.toLowerCase()}-loans/${id}`;
        await apiClient.delete(endpoint);
        setLoansList((prev) => prev.filter((loan) => loan.id !== id));
        toast.success('Loan deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete loan');
      }
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
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

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const columns = [
    {
      key: 'loanNumber',
      label: 'Loan Number',
      render: (value, row) => (
        <Link
          href={`${routePrefix}/${row.id}`}
          className="font-medium text-primary hover:text-secondary hover:underline"
        >
          {value}
        </Link>
      ),
    },
    { key: 'customerName', label: 'Customer Name' },
    ...(loanType !== 'Daily' && loanType !== 'Weekly' ? [{ key: 'vehicleNumber', label: 'Vehicle Number' }] : []),
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
      render: (_, row) => {
        const isOpen = activeDropdownId === row.id;
        const index = paginatedData.findIndex((item) => item.id === row.id);
        const openUpward = paginatedData.length > 2 && index >= paginatedData.length - 2;

        return (
          <div className="relative actions-dropdown-container">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDropdownId(isOpen ? null : row.id);
              }}
              className="rounded-lg p-1.5 text-text-secondary hover:bg-background-custom hover:text-text-primary transition-colors flex items-center justify-center border border-border-custom cursor-pointer"
            >
              <MoreVertical className="h-4.5 w-4.5" />
            </button>

            {isOpen && (
              <div className={`absolute right-0 ${openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-40 rounded-xl border border-border-custom bg-white p-1.5 shadow-xl shadow-black/5 z-40`}>
                <Link
                  href={`${routePrefix}/${row.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-background-custom transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  View Details
                </Link>
                <Link
                  href={`${routePrefix}/${row.id}/edit`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-primary hover:bg-[var(--color-success-bg)] hover:text-success transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5 text-success" />
                  Edit Loan
                </Link>
                <hr className="my-1 border-border-custom" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLoan(row.id);
                    setActiveDropdownId(null);
                  }}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  Delete Loan
                </button>
              </div>
            )}
          </div>
        );
      },
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
            placeholder={loanType === 'Daily' || loanType === 'Weekly' ? "Search by loan number or customer name..." : "Search by loan number, customer name, or vehicle..."}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-text-secondary font-medium">
            Showing <strong>{(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> loans
          </span>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Rows:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(e.target.value)}
              className="rounded-lg border border-border-custom bg-background-custom px-2 py-1 text-xs font-semibold text-text-primary focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              {[5, 10, 25, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow">
        <DataTable columns={columns} data={paginatedData} />
      </div>

      {/* Pagination — always visible */}
      <div className="mt-0 rounded-b-lg border border-t-0 border-border-custom bg-white">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

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
