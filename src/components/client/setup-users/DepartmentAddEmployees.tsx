import { Button } from '@/components/ui/button';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react'
import CardLeader from '../users/CardLeader';
import { useAuth } from '@/lib/auth/hooks';

export default function DepartmentAddEmployees(
  { onNext, onLeaderSelected }
) {

  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [first, setFirst] = useState(true);
  const [leaders, setLeaders] = useState([]);

  const handleNextClick = () => {
    onNext();
  };

  const getLeaders = useCallback(
    async () => {
      setIsSubmitting(true);
      setError('');
      const response = await fetch(`/api/v1/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      setIsSubmitting(false);

      const responseData = await response.json();

      console.log('responseData: ', responseData);

      if (!response.ok) {
        setError(responseData.error);
      }
    },
    [],
  )
  

  useEffect(() => {
    if (first) {
      setFirst(false);
      getLeaders();
    }
  }, [first, getLeaders]);

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
