'use client';

import Link from 'next/link';
import { MENU_ITEMS } from '@/utils/constants';
import { mockLoans } from '@/mock/loans';
import { mockEmployees } from '@/mock/employees';
import { mockApprovals } from '@/mock/approvals';
import { mockExpenses } from '@/mock/expenses';
import { formatCurrency } from '@/utils/formatting';
import * as Icons from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    {
      label: 'Active Loans',
      value: mockLoans.filter((l) => l.status === 'Active').length,
      icon: 'Banknote',
      color: 'bg-primary/20 text-primary',
    },
    {
      label: 'Pending Approvals',
      value: mockApprovals.filter((a) => a.status === 'Pending').length,
      icon: 'CheckCircle',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Total Employees',
      value: mockEmployees.length,
      icon: 'Users',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Total Expenses',
      value: formatCurrency(mockExpenses.reduce((sum, e) => sum + e.amount, 0)),
      icon: 'CreditCard',
      color: 'bg-green-100 text-green-600',
    },
  ];

  const recentLoans = mockLoans.slice(0, 5);
  const recentApprovals = mockApprovals.slice(0, 5);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome to Square Finance Loan Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = Icons[stat.icon];
          return (
            <div
              key={index}
              className="rounded-lg bg-white p-6 shadow transition-all hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Links</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {MENU_ITEMS.map((item) => {
            const Icon = Icons[item.icon];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-primary hover:bg-primary/5"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-medium text-gray-900">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Loans */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Loans</h2>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Loan Number
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {loan.loanNumber}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{loan.customerName}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          loan.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : loan.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-6 py-4">
            <Link
              href="/monthly-loans"
              className="text-sm font-medium text-primary hover:text-secondary"
            >
              View all loans →
            </Link>
          </div>
        </div>

        {/* Recent Approvals */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Approvals</h2>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {approval.approvalId}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{approval.type}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          approval.status === 'Approved'
                            ? 'bg-green-100 text-green-800'
                            : approval.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {approval.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-6 py-4">
            <Link
              href="/approvals"
              className="text-sm font-medium text-primary hover:text-secondary"
            >
              View all approvals →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
