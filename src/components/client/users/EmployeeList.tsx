import React from "react";
import Avatar from "../Avatar";

type Employee = {
  id: number;
  name: string;
  role: string;
  tags: string[];
  assessment: string;
};

type EmployeeListProps = {
  employees: Employee[];
};

const EmployeeList: React.FC<EmployeeListProps> = ({ employees }) => (
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
  </div>
);

export default EmployeeList;