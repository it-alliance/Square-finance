'use client';

import { getStatusColor } from '@/utils/formatting';

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
}
