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
    <div className="rounded-lg bg-white shadow overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="border-b border-gray-100 bg-gray-50/60">
          <tr>
            {columns.map((column) => {
              const isSticky = column.key === 'loanNumber' || column.sticky;
              return (
                <th
                  key={column.key}
                  className={`px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#737373] whitespace-nowrap ${
                  isSticky ? 'sticky left-0 bg-gray-50 z-20 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]' : ''
                  }`}
                >
                  {column.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              className={`group transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => {
                const isSticky = column.key === 'loanNumber' || column.sticky;
                return (
                  <td
                    key={column.key}
                    className={`px-5 py-4 whitespace-nowrap text-gray-800 ${
                      isSticky ? 'sticky left-0 bg-white group-hover:bg-gray-50 z-10 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.15)]' : ''
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
