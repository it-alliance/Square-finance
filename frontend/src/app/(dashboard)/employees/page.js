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
import { ITEMS_PER_PAGE, EMPLOYEE_STATUSES } from '@/utils/constants';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import TableFilters from '@/components/tables/TableFilters';
import toast from 'react-hot-toast';
import { confirmToast } from '@/utils/toast-utils';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employees, setEmployees] = useState(mockEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filter and search
  const filteredData = useMemo(() => {
    let data = searchFilter(employees, searchTerm, [
      'employeeId',
      'employeeName',
      'email',
    ]);

    if (activeFilters.status) {
      data = data.filter((item) => item.status === activeFilters.status);
    }

    return data;
  }, [searchTerm, activeFilters, employees]);

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

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
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
          employeeId: `EMP${String(prev.length + 1).padStart(3, '0')}`,
          ...data,
        },
      ]);
    }
    toast.success(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = (id) => {
    confirmToast('Are you sure you want to delete this employee?', () => {
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      toast.success('Employee deleted successfully!');
    });
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'designation', label: 'Designation' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedEmployee(row)}
            className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20 transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditEmployee(row)}
            className="rounded-lg bg-[var(--color-success-bg)] p-2 text-success hover:bg-success/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteEmployee(row.id)}
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
        title="Employees"
        description="Manage employee information and roles"
      >
        <button
          onClick={handleAddEmployee}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Employee
        </button>
      </PageHeader>

      {/* Filters & Search */}
      <div className="mb-6 space-y-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, ID, or email..."
          />
          <TableFilters
            filters={[
              {
                key: 'status',
                label: 'Filter by Status',
                options: EMPLOYEE_STATUSES,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
        <p className="text-sm text-gray-600">
          Showing {paginatedData.length} of {filteredData.length} employees
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="mb-4 text-xl font-bold">Employee Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Employee ID</p>
                <p className="font-medium">{selectedEmployee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{selectedEmployee.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Designation</p>
                <p className="font-medium">{selectedEmployee.designation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{selectedEmployee.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedEmployee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  <StatusBadge status={selectedEmployee.status} />
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
