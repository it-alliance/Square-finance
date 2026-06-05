'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { AlertCircle, Clock, PhoneCall, Ban } from 'lucide-react';
import {
  mockPendingPayments,
  mockPartialPayments,
  mockFollowUps,
} from '@/mock/payments';

export default function PaymentsLayout({ children }) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'pending',
      label: 'Pending Payments',
      href: '/payments/pending',
      icon: AlertCircle,
      count: mockPendingPayments.length,
    },
    {
      id: 'partial',
      label: 'Partial Payments',
      href: '/payments/partial',
      icon: Clock,
      count: mockPartialPayments.length,
    },
    {
      id: 'followup',
      label: 'Follow-ups',
      href: '/payments/followup',
      icon: PhoneCall,
      count: mockFollowUps.length,
    },
    {
      id: 'foreclosure',
      label: 'Foreclosure',
      href: '/payments/foreclosure',
      icon: Ban,
      count: null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Payments Management"
        description="Track and manage all payment-related activities"
      />

      {/* Tabs */}
      <div className="mb-6 rounded-lg bg-white border border-border-custom shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b border-border-custom bg-gray-50/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 border-b-2 px-6 py-4 font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary bg-white'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-gray-50/30'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-neutral'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                    isActive 
                      ? 'bg-primary/5 text-primary border-primary/20' 
                      : 'bg-white text-text-secondary border-border-custom'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </>
  );
}
