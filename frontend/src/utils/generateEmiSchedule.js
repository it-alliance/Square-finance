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
      if (rate > 0) {
        const dailyRate = rate / 100 / 365;
        emiAmount = Math.round(
          (principal * dailyRate * Math.pow(1 + dailyRate, terms)) /
          (Math.pow(1 + dailyRate, terms) - 1)
        );
      } else {
        emiAmount = Math.round(principal / terms);
      }
    } else if (loanType === 'Weekly') {
      dueDate.setDate(startDate.getDate() + i * 7);
      if (rate > 0) {
        const weeklyRate = rate / 100 / 52;
        emiAmount = Math.round(
          (principal * weeklyRate * Math.pow(1 + weeklyRate, terms)) /
          (Math.pow(1 + weeklyRate, terms) - 1)
        );
      } else {
        emiAmount = Math.round(principal / terms);
      }
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
      if (rate > 0) {
        const monthlyRate = rate / 100 / 12;
        emiAmount = Math.round(
          (principal * monthlyRate * Math.pow(1 + monthlyRate, terms)) /
          (Math.pow(1 + monthlyRate, terms) - 1)
        );
      } else {
        emiAmount = Math.round(principal / terms);
      }
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
