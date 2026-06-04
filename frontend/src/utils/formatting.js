export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN').format(new Date(date));
};

export const getStatusColor = (status) => {
  const statusMap = {
    Active: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/10',
    Approved: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/10',
    Pending: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/10',
    Partial: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/10',
    Foreclosure: 'bg-[#FEE2E2] text-[var(--color-danger)] border border-[var(--color-danger)]/10',
    Closed: 'bg-[#F3F4F6] text-[var(--color-text-secondary)] border border-[#F3F4F6]',
    Rejected: 'bg-[#FEE2E2] text-[var(--color-danger)] border border-[var(--color-danger)]/10',
    Overdue: 'bg-[#FEE2E2] text-[var(--color-danger)] border border-[var(--color-danger)]/10',
    Settled: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success)]/10',
  };
  return statusMap[status] || 'bg-[#F3F4F6] text-[var(--color-text-secondary)] border border-[#F3F4F6]';
};

export const searchFilter = (items, searchTerm, searchFields) => {
  if (!searchTerm) return items;

  const lowerSearchTerm = searchTerm.toLowerCase();

  return items.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(lowerSearchTerm);
    })
  );
};
