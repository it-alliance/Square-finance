'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { EMPLOYEE_STATUSES } from '@/utils/constants';

const employeeSchema = z.object({
  employeeName: z.string().min(2, 'Name must be at least 2 characters'),
  designation: z.string().min(2, 'Designation is required'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  status: z.enum(EMPLOYEE_STATUSES),
});

export default function EmployeeForm({ employee, onSubmit, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      employeeName: '',
      designation: '',
      phoneNumber: '',
      email: '',
      status: 'Active',
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-4 text-xl font-bold text-text-primary">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Employee Name
            </label>
            <input
              type="text"
              {...register('employeeName')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.employeeName && (
              <p className="mt-1 text-sm text-danger">
                {errors.employeeName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Designation
            </label>
            <input
              type="text"
              {...register('designation')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.designation && (
              <p className="mt-1 text-sm text-danger">
                {errors.designation.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Phone Number
            </label>
            <input
              type="tel"
              {...register('phoneNumber')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-danger">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Status
            </label>
            <select
              {...register('status')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            >
              {EMPLOYEE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border-custom bg-white px-4 py-2 font-medium text-primary hover:bg-background-custom transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-secondary transition-colors"
            >
              {employee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
