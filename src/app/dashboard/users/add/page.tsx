"use client"

import CardUserAdd from '@/components/client/users/CardUserAdd'
import Image from 'next/image'
import { useRouter } from 'next/navigation';
import React from 'react'

export default function UsersAddPage() {

  const router = useRouter();

  const handleButtonClick = (userType: string) => {
    console.log(`Creating ${userType}`);
    router.push(`/dashboard/users/add-department?userType=${encodeURIComponent(userType)}`);
  };

  return (
    <div className='p-4'>
      <div className='mb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold mb-4'>
          Create User
        </h1>
      </div>

      <div className="flex justify-center w-full mt-4">
        <div className='w-11/12 md:w-3/5'>
          <div className='flex justify-center mt-2'>
            <div className='p-4 border border-gray-300 shadow-md rounded-lg'>
              <Image
                src="/images/icons/user-circle.svg" 
                alt="User Icon" 
                width={25} 
                height={25} 
              />
            </div>
          </div>

          <div className='text-center mt-8'>
            <h2 className="text-2xl font-bold my-2">
              What type of user you wants to create?
            </h2>
            <div className='text-gray-600 pt-2 mt-0 text-sm'>
              In Voxerion you can create Leaders, which usually are the heads of a department, and Regular Users, which can get insights from their peers. 
            </div>
          </div>

        </div>
      </div>

      <div className='flex justify-center gap-4 mt-8'>
        <div>
          <CardUserAdd
            title="Leader"
            description="Leads departments, and have employees who reports to him. Leaders receive insights from employees by any departments."
            buttonText="Create Leader"
            onButtonClick={() => handleButtonClick('Leader')}
          />
        </div>
        <div>
          <CardUserAdd
            title="Regular User"
            description="Users receive insights from employees by their departments."
            buttonText="Create User"
            onButtonClick={() => handleButtonClick('User')}
          />
        </div>
      </div>

    </div>
  )
}
