import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useState } from 'react'
import CardLeader from '../users/CardLeader';

export default function DepartmentAddEmployees(
  { leaders, onNext, onLeaderSelected }
) {

  const handleNextClick = () => {
    onNext();
  };

  return (
    <div className="bg-white border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap justify-center mx-auto px-4">
        <div className="w-full">
          <div className="flex justify-center">
            <Image
              src="/images/icons/key.svg"
              alt="key icon"
              width={28}
              height={28}
              className="inline-block"
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Department/Area Employees
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Now it&apos;s time to add the employees to your department. Please select one of the leaders below to begin.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {
              leaders.map((leader, index) => (
                <CardLeader
                  key={index}
                  id={leader.id}
                  name={leader.name}
                  email={leader.email}
                  role={leader.role}
                  onLeaderSelected={onLeaderSelected}
                />
                // <div 
                //   key={index} 
                //   className="cursor-pointer bg-gray-50 rounded-lg shadow p-4 m-2 flex flex-col items-start border border-gray-200"
                //   onClick={() => onLeaderSelected(leader)}
                // >
                //   <div className="font-semibold text-lg text-[#101828]">{leader.name}</div>
                //   <div className="text-[#475467] text-sm mt-1">{leader.email}</div>
                //   <div className="text-[#475467] text-sm mt-2 py-1 uppercase">{leader.role}</div>
                // </div>
            ))}
          </div>

          <div className="py-4">
            <Button
              type="submit"
              className="w-full"
              onClick={handleNextClick}
            >
              Continue
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
