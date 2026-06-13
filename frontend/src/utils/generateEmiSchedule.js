export const generateEmiSchedule = (
  principalAmount,
  tenure,
  emiStartDate,
  loanId,
  loanType = 'Monthly',
  interestRate = 0
) => {
  const principal = Number(principalAmount) || 0;
  const terms = Number(tenure) || 1;
  const rate = Number(interestRate) || 0;
  const startDate = emiStartDate ? new Date(emiStartDate) : new Date();

  const schedule = [];

  for (let i = 0; i < terms; i++) {
    const dueDate = new Date(startDate);
    let emiAmount = 0;

    // Calculate dates and amounts based on loan type
    if (loanType === 'Daily') {
      dueDate.setDate(startDate.getDate() + i);
      const interestAmountPerPeriod = principal * (rate / 100);
      const totalInterestAmount = terms * interestAmountPerPeriod;
      const totalAmount = principal + totalInterestAmount;
      emiAmount = Math.ceil(totalAmount / terms);
    } else if (loanType === 'Weekly') {
      dueDate.setDate(startDate.getDate() + i * 7);
      const interestAmountPerPeriod = principal * (rate / 100);
      const totalInterestAmount = terms * interestAmountPerPeriod;
      const totalAmount = principal + totalInterestAmount;
      emiAmount = Math.ceil(totalAmount / terms);
    } else if (loanType === 'Interest') {
      dueDate.setMonth(startDate.getMonth() + i);
      const monthlyRate = rate / 100 / 12;
      const interestOnlyAmount = Math.round(principal * monthlyRate);
      if (i === terms - 1) {
        // Last EMI is interest + principal
        emiAmount = interestOnlyAmount + principal;
      } else {
        emiAmount = interestOnlyAmount;
      }
    } else {
      // Monthly (Default)
      dueDate.setMonth(startDate.getMonth() + i);
      const interestAmountPerPeriod = principal * (rate / 100);
      const totalInterestAmount = terms * interestAmountPerPeriod;
      const totalAmount = principal + totalInterestAmount;
      emiAmount = Math.ceil(totalAmount / terms);
    }

    schedule.push({
      id: `${loanId}-emi-${i + 1}`,
      loanId,
      emiNumber: i + 1,
      dueDate: dueDate.toISOString(),
      emiAmount,
      payments: [],
      overdues: [],
      totalPaid: 0,
      remainingAmount: emiAmount,
      paymentStatus: 'Pending',
      remarks: '',
      approvedBy: '-',
      lastUpdated: '-',
    });
  }

  return schedule;
};
