'use client';

import { Loader } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
