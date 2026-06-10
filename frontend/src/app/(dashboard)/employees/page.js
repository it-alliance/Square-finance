'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/common/PageHeader';
import SearchInput from '@/components/common/SearchInput';
import StatusBadge from '@/components/common/StatusBadge';
import DataTable from '@/components/tables/DataTable';
import Pagination from '@/components/tables/Pagination';
import EmployeeForm from '@/components/forms/EmployeeForm';
import { mockEmployees } from '@/mock/employees';
import { searchFilter } from '@/utils/formatting';
import { ITEMS_PER_PAGE } from '@/utils/constants';
import { Plus, Eye, Edit2, Trash2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState(mockEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  // Filter and search
  const filteredData = useMemo(() => {
    let data = searchFilter(employees, searchTerm, [
      'accessKey',
      'operatorName',
      'credentialId',
    ]);
    return data;
  }, [searchTerm, employees]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleExport = () => {
    toast.success('Exporting operators data...');
  };

  const handleFormSubmit = (data) => {
    if (editingEmployee) {
      // Update existing employee
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editingEmployee.id ? { ...emp, ...data } : emp
        )
      );
    } else {
      // Add new employee
      setEmployees((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          ...data,
        },
      ]);
    }
    toast.success(editingEmployee ? 'Operator updated successfully!' : 'Operator created successfully!');
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id) => {
    confirmToast('Are you sure you want to delete this operator?', () => {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success('Operator deleted successfully!');
    });
  };

  const columns = [
    { key: 'accessKey', label: 'Access Key', render: (val) => <span className="uppercase font-bold text-gray-900">{val}</span> },
    { key: 'operatorName', label: 'Operator Name', render: (val) => <span className="font-bold text-primary">{val}</span> },
    { key: 'credentialId', label: 'Credential ID' },
    { key: 'protocolLevel', label: 'Protocol Level' },
    {
      key: 'registryStatus',
      label: 'Registry Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
  key: 'actions',
  label: 'Actions',
  render: (_, row) => (
    <div className="relative">
      <button
        onClick={() =>
          setOpenMenu(openMenu === row.id ? null : row.id)
        }
        className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
      </button>

      {openMenu === row.id && (
        <div className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => {
              setSelectedEmployee(row);
              setOpenMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Eye className="h-4 w-4" />
            View
          </button>

          <button
            onClick={() => {
              handleEditEmployee(row);
              setOpenMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>

          <button
            onClick={() => {
              handleDeleteEmployee(row.id);
              setOpenMenu(null);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  ),
},
  ];

  return (
    <>
      <PageHeader
        title="Employee Management"
        description={`${paginatedData.length} operator records identified in system`}
      >
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary transition-all hover:bg-background-custom"
          >
            Export
          </button>
          <button
            onClick={handleAddEmployee}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Operator
          </button>
        </div>
      </PageHeader>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Name, Email or Access Key"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow mt-6">
        <DataTable columns={columns} data={paginatedData} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-0 rounded-b-lg border border-t-0 border-border-custom bg-white">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingEmployee(null);
          }}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold">Operator Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Access Key</p>
                <p className="font-medium uppercase">{selectedEmployee.accessKey}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Operator Name</p>
                <p className="font-medium">{selectedEmployee.operatorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Credential ID</p>
                <p className="font-medium">{selectedEmployee.credentialId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Protocol Level</p>
                <p className="font-medium">{selectedEmployee.protocolLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Approval</p>
                <p className="font-medium">{selectedEmployee.paymentApproval ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedEmployee.registryStatus} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  handleEditEmployee(selectedEmployee);
                  setSelectedEmployee(null);
                }}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="flex-1 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary hover:bg-background-custom transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
