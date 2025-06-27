import React from "react";
import Avatar from "../Avatar";
import ProgressBar from "../ProgressBar";
import Pagination from "../Pagination";

type User = {
  id: number;
  name: string;
  role: string;
  tags: string[];
  assessment: string;
  utilization: number;
  company_role: string;
};

type UserListProps = {
  users: User[];
  handlePageChange: (page: number) => void;
};

const UserList: React.FC<UserListProps> = ({ users, handlePageChange, meta }) => (

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
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Utilization
          </th>
        </tr>
      </thead>
      <tbody>
        {users.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
              No users found.
            </td>
          </tr>
        ) : (
          users.map((user) => (
            <tr key={user.id} className="border">
              <td className="px-6 py-4 whitespace-nowrap">
                <Avatar
                  name={user.name}
                  description={user.company_role}
                  imageUrl={`/images/icons/avatar.svg`} // Assuming images are named by user ID
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.tags &&user.tags.map((tag, index) => (
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
                    className={`w-2 h-2 rounded-full mr-2 ${user.assessment === 'Active' ? 'bg-green-500' : user.assessment === 'Pending' ? 'bg-red-500' : 'bg-gray-500'}`}
                  ></span>
                  {user.assessment}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <ProgressBar
                  value={user.utilization}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    <div className="w-full mt-4">
        <Pagination
          currentPage={meta.currentPage} // Replace with actual current page state
          totalPages={meta.totalPages} // Replace with actual total pages state
          onPageChange={handlePageChange} // Replace with actual page change handler
        />
    </div>
  
  </div>
);

export default UserList;