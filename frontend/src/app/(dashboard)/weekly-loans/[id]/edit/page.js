'use client';

import { use } from 'react';
import EditLoanTemplate from '@/components/loans/EditLoanTemplate';

export default function EditWeeklyLoanPage({ params }) {
  const resolvedParams = use(params);
  const loanId = parseInt(resolvedParams.id, 10);

  return <EditLoanTemplate loanType="Weekly" loanId={loanId} />;
}
