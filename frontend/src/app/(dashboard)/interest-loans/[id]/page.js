'use client';

import { use } from 'react';
import LoanDetailsTemplate from '@/components/loans/LoanDetailsTemplate';

export default function InterestLoanDetailsPage({ params }) {
  const resolvedParams = use(params);
  const loanId = parseInt(resolvedParams.id, 10);

  return <LoanDetailsTemplate loanType="Interest" loanId={loanId} />;
}
