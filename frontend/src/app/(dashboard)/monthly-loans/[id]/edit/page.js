'use client';

import { use } from 'react';
import EditLoanTemplate from '@/components/loans/EditLoanTemplate';

export default function EditMonthlyLoanPage({ params }) {
  const resolvedParams = use(params);
  const loanId = resolvedParams.id;

  return <EditLoanTemplate loanType="Monthly" loanId={loanId} />;
}
