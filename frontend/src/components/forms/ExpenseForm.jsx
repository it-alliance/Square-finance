'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { mockLoans } from '@/mock/loans';

const expenseSchema = z.object({
  isOfficeExpense: z.boolean(),
  loanNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  particulars: z.string().min(2, 'Particulars must be at least 2 characters'),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
});

export default function ExpenseForm({ expense, onSubmit, onClose }) {
  const isEditing = !!expense;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      isOfficeExpense: expense?.type === 'Office' ? true : false,
      loanNumber: expense?.loanNumber || '',
      vehicleNumber: expense?.vehicleNumber || '',
      particulars: expense?.particulars || '',
      date: expense?.date || new Date().toISOString().split('T')[0],
      amount: expense?.amount || '',
    },
  });

  const isOfficeExpense = watch('isOfficeExpense');
  const loanNumber = watch('loanNumber');

  // Clear loan/vehicle fields if toggled to office expense
  useEffect(() => {
    if (isOfficeExpense) {
      setValue('loanNumber', '');
      setValue('vehicleNumber', '');
    }
  }, [isOfficeExpense, setValue]);

  // Auto-fill vehicle number based on loan number
  useEffect(() => {
    if (!isOfficeExpense && loanNumber && loanNumber.length >= 3) {
      const matchedLoan = mockLoans.find(
        (l) => l.loanNumber.toLowerCase() === loanNumber.toLowerCase()
      );
      if (matchedLoan && matchedLoan.vehicleNumber) {
        setValue('vehicleNumber', matchedLoan.vehicleNumber, { shouldValidate: true });
      }
    }
  }, [loanNumber, isOfficeExpense, setValue]);

  const submitHandler = (data) => {
    onSubmit({
      ...data,
      type: data.isOfficeExpense ? 'Office' : 'Loan',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-[20px] bg-white p-8 shadow-2xl ring-1 ring-black/5">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
          <p className="text-sm text-gray-500 mt-1">Record operational cost</p>
        </div>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
          {/* Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setValue('isOfficeExpense', !isOfficeExpense)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isOfficeExpense ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isOfficeExpense ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm font-semibold text-gray-700">Office Expense</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Loan Number
              </label>
              <input
                type="text"
                disabled={isOfficeExpense}
                placeholder="E.G. L-123"
                {...register('loanNumber')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                disabled={isOfficeExpense}
                placeholder="E.G. GJ01..."
                {...register('vehicleNumber')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Particulars
            </label>
            <input
              type="text"
              placeholder="Reason for expense..."
              {...register('particulars')}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white"
            />
            {errors.particulars && (
              <p className="mt-1 text-xs text-red-500">{errors.particulars.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register('amount')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-3.5 mt-2 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-secondary hover:shadow-primary/40 active:scale-[0.98]"
          >
            {isEditing ? 'Update Expense' : 'Save Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
