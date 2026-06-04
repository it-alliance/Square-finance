'use client';

import { use } from 'react';
import EditLoanTemplate from '@/components/loans/EditLoanTemplate';

export default function EditMonthlyLoanPage({ params }) {
  const resolvedParams = use(params);
  const loanId = parseInt(resolvedParams.id, 10);

  return <EditLoanTemplate loanType="Monthly" loanId={loanId} />;
}
