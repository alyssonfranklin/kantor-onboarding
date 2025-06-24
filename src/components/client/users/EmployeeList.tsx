import React from "react";
import Avatar from "../Avatar";
import Pagination from "../Pagination";

type Employee = {
  id: number;
  name: string;
  role: string;
  tags: string[];
  assessment: string;
};

type EmployeeListProps = {
  employees: Employee[];
  handlePageChange: (page: number) => void;
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, handlePageChange }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border-b border-gray-200 rounded-lg shadow-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            &nbsp;
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Tags
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Assessment
          </th>
        </tr>
      </thead>
      <tbody>
        {employees.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
              No employees found.
            </td>
          </tr>
        ) : (
          employees.map((employee) => (
            <tr key={employee.id} className="border">
              <td className="px-6 py-4 whitespace-nowrap">
                <Avatar
                  name={employee.name}
                  description={employee.role}
                  imageUrl={`/images/icons/avatar.svg`} // Assuming images are named by user ID
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {employee.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-block bg-white text-black text-xs font-semibold mr-2 px-2 py-1 rounded border border-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center bg-white text-black border border-gray-300 text-xs font-semibold px-2 py-1 rounded">
                  <span 
                    className={`w-2 h-2 rounded-full mr-2 ${employee.assessment === 'Active' ? 'bg-green-500' : employee.assessment === 'Pending' ? 'bg-red-500' : 'bg-gray-500'}`}
                  ></span>
                  {employee.assessment}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    <div className="w-full mt-4">
        <Pagination
          currentPage={2} // Replace with actual current page state
          totalPages={5} // Replace with actual total pages state
          onPageChange={handlePageChange} // Replace with actual page change handler
        />
    </div>

  </div>
);

export default EmployeeList;