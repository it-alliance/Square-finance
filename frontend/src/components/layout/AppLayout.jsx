'use client';

import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ children, title = 'Dashboard', breadcrumbs }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar title={title} breadcrumbs={breadcrumbs} />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}