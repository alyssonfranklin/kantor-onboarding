"use client"

import Image from 'next/image'
import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CardLeader from '@/components/client/users/CardLeader';
import DepartmentAddLeaders from '@/components/client/setup-users/DepartmentAddLeaders';
import { v4 as uuidv4 } from 'uuid';
import SetupUsersConfirmation from '@/components/client/setup-users/SetupUsersConfirmation';

function UsersDepartmentLeadersAddPageContent() {

  const searchParams = useSearchParams()
  const departmentId = searchParams.get('departmentId')
  const departmentName = searchParams.get('departmentName')

  const [showConfirm, setShowConfirm] = useState(false);
  const [leaders, setLeaders] = useState(
    [
      { 
        id: uuidv4(),
        name: '', 
        email: '', 
        role: '', 
        employees: 
        [
          {
            name: '',
            email: '',
            role: ''
          }
        ] 
      }
    ]
  );

  const handleNext = () => {
    console.log('handleNext');
    setShowConfirm(true);
  };

  const handleLeadersChange = (updatedLeaders: { id: string, name: string; email: string; role: string; }[]) => {
    setLeaders(
      updatedLeaders.map(leader => ({
        ...leader,
        employees: leader.hasOwnProperty('employees') ? (leader as any).employees : []
      }))
    );
  };

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
          <DepartmentAddLeaders
            title={`Create ${departmentName} Leaders`}
            onNext={handleNext}
            leaders={leaders} 
            onLeadersChange={handleLeadersChange}
          />
        </div>
      }

      {
        showConfirm &&
        <SetupUsersConfirmation />
      }

    </div>
  )
}

export default function UsersDepartmentLeadersAddPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <UsersDepartmentLeadersAddPageContent />
    </Suspense>
  )
}
