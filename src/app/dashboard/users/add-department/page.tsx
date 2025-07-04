"use client"

import Image from 'next/image'
import React, { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import CardLeader from '@/components/client/users/CardLeader';
import { useAuth } from '@/lib/auth/hooks';
import ModalLoader from '@/components/client/ModalLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UsersDepartmentAddPage() {

  const { user } = useAuth();

  const router = useRouter();

  const [departments, setDepartments] = useState([{}]);
  const [leaders, setLeaders] = useState([{}]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchParams = useSearchParams()
  const userType = searchParams.get('userType')

  const departmentsList = React.useMemo(() => [
    {
      id: 1,
      name: 'Technology',
      users: 6,
      employees: 38,
      leaders: 1
    },
    {
      id: 2,
      name: 'Human Resources',
      users: 4,
      employees: 26,
      leaders: 1
    },
    {
      id: 3,
      name: 'Innovation',
      users: 2,
      employees: 2,
      leaders: 2
    }
  ], []);

  const leadersList = React.useMemo(() => [
    {
      id: 1,
      name: 'Anthony Perkins',
      email: 'anthony.perkins@mycompany.com',
      role: 'First Line Manager'
    },
    {
      id: 2,
      name: 'Thomas Anderson',
      email: 'thomas.anderson@mycompany.com',
      role: 'Second Line Manager'
    },
    {
      id: 3,
      name: 'Jack Torrance',
      email: 'jack.torrance@mycompany.com',
      role: 'Third Line Manager'
    }
  ], []);

  const onDepartmentSelected = (department: any) => {
    // Handle department selection logic here
    console.log('Selected department:', department);
    router.push(`/dashboard/users/add-department-leader?departmentId=${encodeURIComponent(department.id)}&departmentName=${encodeURIComponent(department.name)}`);
  };

  const onLeaderSelected = (leader: any) => {
    // Handle department selection logic here
    console.log('Selected leader:', leader);
    router.push(`/dashboard/users/add-leader-employees?leaderId=${encodeURIComponent(leader.id)}&leaderName=${encodeURIComponent(leader.name)}`);
  };

  const handleAddDepartment = () => {
    console.log('crear nuevo departamento');
  };

  const getDepartments = useCallback(
    async () => {
      try {
        setIsSubmitting(true);
        const response = await fetch(`/api/v1/departments?companyId=${user?.company_id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        setIsSubmitting(false);

        const responseData = await response.json();

        if (!response.ok) {
          setError(responseData.error || 'Ocurrió un error al guardar la información');
          return;
        }
        console.log('responseData.data: ', responseData.data);
        setDepartments(responseData.data);
      } catch (error) {
        let errorMessage = 'Ocurrió un error al obtener los departamentos';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object' && error !== null && 'toString' in error) {
          errorMessage = error.toString();
        }
        setError(errorMessage);
        setIsSubmitting(false);
      }
    },
    [user?.company_id],
  )
  

  useEffect(() => {
    if (userType === 'Leader') {
      getDepartments();
    }
    if (userType === 'User') {
      setLeaders(leadersList);
    }
    return () => {
      
    };
  }, [getDepartments, leadersList, userType]);

  return (
    <>
    
      {
        isSubmitting &&
        <ModalLoader
          message="Cargando..."
        />
      }

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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='text-center mt-8'>
              <h2 className="text-2xl font-bold my-2">
                { userType === 'Leader' ? 'Select a Department' : 'Select a Leader'}
              </h2>
              <div className='text-gray-600 pt-2 mt-0 text-sm'>
                {
                  userType === 'Leader'
                    ? 'Voxerion has a enterprise-grade protection to avoid unauthorized insights based into the departmental organization of your company. Select one of your Departments to start the creation.'
                    : 'Voxerion has a enterprise-grade protection to avoid unauthorized insights based into the departmental organization of your company. Select one of your Leaders to start the creation.'
                }
              </div>
            </div>

          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-4 md:gap-4 mt-8'>
          {
            userType === 'Leader' && departments.map((dept: any) => (
              <CardLeader
                key={dept.id}
                id={dept.id}
                name={dept.department_name}
                email={`${dept.users} users, ${dept.employees} employees`}
                role={`${dept.leaders} leaders`}
                onLeaderSelected={() => onDepartmentSelected(dept)}
              />
            ))
          }

          {
            userType === 'User' && leaders.map((leader: any) => (
              <CardLeader
                key={leader.id}
                id={leader.id}
                name={leader.name}
                email={leader.email}
                role={leader.role}
                onLeaderSelected={() => onLeaderSelected(leader)}
              />
            ))
          }

          {
            userType === 'Leader' &&
            <div 
              className="text-xl font-semibold cursor-pointer bg-gray-50 rounded-lg shadow p-4 m-2 flex flex-col items-start border border-gray-200"
              onClick={() => handleAddDepartment()}
            >
              CREATE NEW DEPARTMENT
            </div>
          }

        </div>

      </div>
    
    </>
  )
}
