'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '@/utils/constants';

const expenseSchema = z.object({
  expenseName: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
});

export default function ExpenseForm({ expense, onSubmit, onClose }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense || {
      expenseName: '',
      category: EXPENSE_CATEGORIES[0],
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
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
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary">
              Expense Name
            </label>
            <input
              type="text"
              {...register('expenseName')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.expenseName && (
              <p className="mt-1 text-sm text-danger">
                {errors.expenseName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Category
            </label>
            <select
              {...register('category')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Amount (₹)
            </label>
            <input
              type="number"
              {...register('amount')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-danger">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Date
            </label>
            <input
              type="date"
              {...register('date')}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-danger">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 w-full rounded-lg border border-border-custom bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 text-text-primary"
            />
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
              {expense ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
