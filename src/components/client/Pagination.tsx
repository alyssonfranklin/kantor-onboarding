import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex items-center justify-between w-full py-2 border-t border-gray-200">
      {/* Previous Button */}
      <button
        className={`px-4 py-2 rounded-lg bg-white text-sm text-black font-semibold border border-gray-300 hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {/* Page Label */}
      <span className="text-gray-700 font-medium">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Button */}
      <button
        className={`px-4 py-2 rounded-lg bg-white text-sm text-black font-semibold border border-gray-300 hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;