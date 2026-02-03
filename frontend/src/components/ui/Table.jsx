import { ChevronLeft, ChevronRight } from 'lucide-react';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  emptyMessage = 'No data available',
  pagination,
  onPageChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-secondary-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={`px-6 py-4 text-left ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr 
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={`table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key} 
                      className={`px-6 py-4 ${column.cellClassName || ''}`}
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-12 text-center text-secondary-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary-100">
          <p className="text-sm text-secondary-500">
            Showing {pagination.from} to {pagination.to} of {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-secondary-600" />
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  page === pagination.currentPage
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-secondary-100 text-secondary-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-secondary-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
