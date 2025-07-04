"use client";

import ModalLoader from '@/components/client/ModalLoader';
import UserList from '@/components/client/users/UserList'
import UsersNavBar from '@/components/client/users/UsersNavBar';
import { useAuth } from '@/lib/auth/hooks';
import React, { useCallback, useEffect, useState } from 'react'
/**
 *
 *
 * @export
 * @return {*} 
 */
export default function UsersPage() {

  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [limitRows, setLimitRows] = useState(10);
  const [meta, setMeta] = useState({currentPage: 1, totalPages: 1});

  const handlePageChange = (page: number) => {
    const skip = (page - 1) * limitRows;
    getUsers(skip);
  };

  const makeMetaData = useCallback(
    (meta) => {
      console.log('meta: ', meta);
      const { skip, total } = meta;
      const currentPage = Math.floor(skip / limitRows) + 1;
      const totalPages = Math.ceil(total / limitRows);
      setMeta({ ...meta, currentPage, totalPages });
    },
    [limitRows],
  );
  

  const getUsers = useCallback(
    async (skip: number) => {
      console.log('user: ', user);
      setIsSubmitting(true);
      setError('');
      try {
        const response = await fetch(`/api/v1/users?companyId=${user?.company_id}&limit=${limitRows}&skip=${skip}`, {
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
        setUsers(responseData.data);
        makeMetaData(responseData.meta);
      } catch (error) {
        let errorMessage = 'Ocurrió un error al guardar la información';
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
    }, [limitRows, makeMetaData, user],
  );

  useEffect(() => {
    getUsers(0);
    return () => {
      
    };
  }, [getUsers]);
  

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
            Users
          </h1>
        </div>

        <div>
          <UsersNavBar />
        </div>

        <div className='w-full mt-6'>
          {
            users.length > 0 &&
            <UserList
              users={users}
              handlePageChange={handlePageChange}
              meta={meta}
            />
          }
        </div>

      </div>
    
    </>
  )
}
