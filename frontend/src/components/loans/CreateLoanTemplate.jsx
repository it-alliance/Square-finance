'use client';

import CreateLoanForm from '@/components/forms/CreateLoanForm';

export default function CreateLoanTemplate({ loanType }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New {loanType} Loan</h1>
        <p className="mt-2 text-gray-600">Initialize a new {loanType.toLowerCase()} loan record in the system</p>
      </div>

      <CreateLoanForm defaultLoanType={loanType} />
    </>
  );
}
