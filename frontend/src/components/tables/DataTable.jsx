'use client';

export default function DataTable({ columns, data, onRowClick }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map((column) => {
              const isSticky = column.key === 'loanNumber' || column.sticky;
              return (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left font-medium text-gray-700 whitespace-nowrap ${
                    isSticky ? 'sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                  }`}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              className={`group transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/30'
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const isSticky = column.key === 'loanNumber' || column.sticky;
                return (
                  <td
                    key={column.key}
                    className={`px-6 py-4 text-gray-900 whitespace-nowrap ${
                      isSticky ? 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

}
