'use client';

export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {children && <div className="flex gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
}
