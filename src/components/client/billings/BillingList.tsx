import Image from "next/image";
import React from "react";

type Billing = {
  id: number;
  date: Date;
  description: string;
  users: number;
  employees: number;
  total: number;
  status: string;
  account: {
    id: number;
    brand: string;
    brandImage: string;
    lastDigits: string;
    expiration: string;
  }
};

type BillingListProps = {
  users: Billing[];
};

const BillingList: React.FC<BillingListProps> = ({ billings }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full bg-white border-b border-gray-200 rounded-lg shadow-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Date & Description
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Number of users
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Number of Employees
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Total
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Status
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">
            Account
          </th>
        </tr>
      </thead>
      <tbody>
        {billings.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
              No billings found.
            </td>
          </tr>
        ) : (
          billings.map((billing) => (
            <tr key={billing.id} className="border-t">
              <td className="px-6 py-4 whitespace-nowrap">
                {billing.date.toLocaleDateString()} - {billing.description}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                { billing.users }
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                { billing.employees }
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                ${ billing.total.toFixed(2) }
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <span className="inline-flex items-center bg-white text-black border border-gray-300 text-xs font-semibold px-2 py-1 rounded">
                  <span 
                    className={`w-2 h-2 rounded-full mr-2 ${billing.status === 'Paid' ? 'bg-green-500' : 'bg-red-500'}`}
                  ></span>
                  {billing.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Image
                    src={billing.account.brandImage}
                    alt="billing.account.brand"
                    width={40} 
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div>
                      {billing.account.brand} - {billing.account.lastDigits}
                    </div>
                    <div>
                      Expiry: {billing.account.expiration}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default BillingList;
