"use client"

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import CardLeader from '@/components/client/users/CardLeader';
import DepartmentAddLeaders from '@/components/client/setup-users/DepartmentAddLeaders';
import { v4 as uuidv4 } from 'uuid';
import SetupUsersConfirmation from '@/components/client/setup-users/SetupUsersConfirmation';
import DepartmentAddEmployeesByLeader from '@/components/client/setup-users/DepartmentAddEmployeesByLeader';
import EmployeesConfirmation from '@/components/client/users/EmployeesConfirmation';

export default function UsersLeaderEmployeesAddPage() {

  const searchParams = useSearchParams()
  const leaderId = searchParams.get('leaderId')
  const leaderName = searchParams.get('leaderName')

  const [showConfirm, setShowConfirm] = useState(false);
  const [leaderSelected, setLeaderSelected] = useState(
    { 
      id: 0,
      name: ''
    }
  );
  const [employees, setEmployees] = useState<{ name: string; email: string; role: string }[] | null>(
    [
      {
        name: '',
        email: '',
        role: ''
      }
    ]
  );

  const handleNext = () => {
    console.log('handleNext');
    setShowConfirm(true);
  };

  const addEmployeesToLeader = (theEmployees) => {
    console.log('theEmployees: ', theEmployees);
    setEmployees(theEmployees);

    handleNext();
  };

  useEffect(() => {
    setLeaderSelected(
      {
        id: parseInt(leaderId || '0'),
        name: leaderName || ''
      }
    );
    return () => {
      
    };
  }, [leaderId, leaderName]);

  return (
    <div className='p-4'>
      <div className='mb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold mb-4'>
          Create User
        </h1>
      </div>

      {
        !showConfirm &&
        <div className="flex justify-center w-full mt-4">
          <DepartmentAddEmployeesByLeader 
            leader={leaderSelected}
            employees={employees}
            addEmployeesToLeader={addEmployeesToLeader}
            departmentName={'General'}
          />
        </div>
      }

      {
        showConfirm &&
        <EmployeesConfirmation />
      }

    </div>
  )
}
