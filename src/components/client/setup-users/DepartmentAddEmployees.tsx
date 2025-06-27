import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react'
import CardLeader from '../users/CardLeader';
import { useAuth } from '@/lib/auth/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DepartmentAddEmployees(
  { onNext, onLeaderSelected, leaders }
) {

  const [error, setError] = useState('');

  const handleNextClick = () => {
    console.log('handleNextClick - leaders: ', leaders);
    const hasValidLeader = leaders.some(
      (leader) =>
        Array.isArray(leader.employees) &&
        leader.employees.length > 0 &&
        leader.employees.every(
          (emp) =>
            emp.name &&
            emp.email &&
            emp.role &&
            emp.name.trim() !== '' &&
            emp.email.trim() !== '' &&
            emp.role.trim() !== ''
        )
    );

    if (!hasValidLeader) {
      setError('At least one leader must have at least one employee with name, email, and role filled in.');
      return;
    }
    setError('');
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {
              leaders.map((leader, index) => (
                <CardLeader
                  key={index}
                  id={leader?.id}
                  name={leader?.name}
                  email={leader?.email}
                  role={leader?.role}
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
