'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import TableFilters from '@/components/tables/TableFilters';
import { mockApprovals } from '@/mock/approvals';
import { formatDate, searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE, APPROVAL_TYPES, APPROVAL_STATUSES } from '@/utils/constants';
import { Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApprovalsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvals, setApprovals] = useState(mockApprovals);

  // Filter and search
  const filteredData = useMemo(() => {
    let data = searchFilter(approvals, searchTerm, [
      'approvalId',
      'requestedBy',
      'description',
    ]);

    if (activeFilters.type) {
      data = data.filter((item) => item.type === activeFilters.type);
    }

    if (activeFilters.status) {
      data = data.filter((item) => item.status === activeFilters.status);
    }

    return data;
  }, [searchTerm, activeFilters, approvals]);

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

  const handleApprove = (id) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === id ? { ...approval, status: 'Approved' } : approval
      )
    );
    toast.success('Approval request approved successfully!');
  };

  const handleReject = (id) => {
    setApprovals((prev) =>
      prev.map((approval) =>
        approval.id === id ? { ...approval, status: 'Rejected' } : approval
      )
    );
    toast.success('Approval request rejected.');
  };

  const columns = [
    { key: 'approvalId', label: 'Approval ID' },
    { key: 'type', label: 'Type' },
    { key: 'requestedBy', label: 'Requested By' },
    {
      key: 'date',
      label: 'Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const isPending = row.status === 'Pending';
        return (
          <div className="flex gap-2">
            {isPending && (
              <>
                <button
                  onClick={() => handleApprove(row.id)}
                  className="rounded-lg bg-[var(--color-success-bg)] p-2 text-success hover:bg-success/20 transition-colors"
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleReject(row.id)}
                  className="rounded-lg bg-danger/10 p-2 text-danger hover:bg-danger/20 transition-colors"
                  title="Reject"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setSelectedApproval(row)}
              className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Review and manage approval requests"
      />

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by approval ID or requester..."
          />
          <TableFilters
            filters={[
              {
                key: 'type',
                label: 'Filter by Type',
                options: APPROVAL_TYPES,
              },
              {
                key: 'status',
                label: 'Filter by Status',
                options: APPROVAL_STATUSES,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
        <p className="text-sm text-gray-600">
          Showing {paginatedData.length} of {filteredData.length} approvals
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

      {/* Approval Detail Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setSelectedApproval(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold">Approval Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Approval ID</p>
                <p className="font-medium">{selectedApproval.approvalId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium">{selectedApproval.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Requested By</p>
                <p className="font-medium">{selectedApproval.requestedBy}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium">{formatDate(selectedApproval.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium text-gray-700">
                  {selectedApproval.description}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedApproval.status} />
                </div>
              </div>
            </div>
            {selectedApproval.status === 'Pending' && (
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    handleApprove(selectedApproval.id);
                    setSelectedApproval(null);
                  }}
                  className="flex-1 rounded-lg bg-success px-4 py-2 font-medium text-white hover:opacity-90 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedApproval.id);
                    setSelectedApproval(null);
                  }}
                  className="flex-1 rounded-lg bg-danger px-4 py-2 font-medium text-white hover:bg-danger-hover transition-colors"
                >
                  Reject
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedApproval(null)}
              className="mt-4 w-full rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary hover:bg-background-custom transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
