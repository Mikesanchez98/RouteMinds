import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-10 w-full mb-4 rounded"></div> {/* Header simulado */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 border-b border-gray-100 py-4">
          {[...Array(columns)].map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableSkeleton;