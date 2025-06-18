import UserList from '@/components/client/users/UserList'
import UsersNavBar from '@/components/client/users/UsersNavBar';
import { Button } from '@/components/ui/button'
import React from 'react'
/**
 *
 *
 * @export
 * @return {*} 
 */
export default function UsersPage() {

  const users = [
    { id: 1, name: 'Phoenix Baker', role: 'Sales', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active', utilization: 75 },
    { id: 2, name: 'Lana Steiner', role: 'IT', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Pending', utilization: 50 },
    { id: 3, name: 'Candice Wu', role: 'Marketing', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active', utilization: 80 },
    { id: 4, name: 'Bob Brown', role: 'Human Resources', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active', utilization: 60 },
    { id: 5, name: 'Charlie White', role: 'Member', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Pending', utilization: 40 }
  ];

  return (
    <div className='p-4'>
      <div className='mb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold mb-4'>
          Users
        </h1>
      </div>

      <div>
        <UsersNavBar />
      </div>

      <div className='w-full mt-6'>
        <UserList
          users={users}
        />
      </div>

    </div>
  )
}
