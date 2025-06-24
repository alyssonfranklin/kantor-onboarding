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
