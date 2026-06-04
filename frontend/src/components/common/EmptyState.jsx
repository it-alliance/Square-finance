'use client';

import { InboxIcon } from 'lucide-react';

export default function EmptyState({ icon: Icon = InboxIcon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12">
      <Icon className="h-12 w-12 text-gray-400" />
      <p className="mt-4 text-center text-gray-600">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
