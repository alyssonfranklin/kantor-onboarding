"use client";

import CalendarRangePicker from '@/components/client/CalendarRangePicker';
import EmployeeList from '@/components/client/users/EmployeeList';
import UsersNavBar from '@/components/client/users/UsersNavBar';
import Image from 'next/image';
import React, { useState } from 'react'

export default function EmployeesPage() {

  const [showDatePicker, setShowDatePicker] = useState(false);

  const employees = [
    { id: 1, name: 'Phoenix Baker', role: 'Sales', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active' },
    { id: 2, name: 'Lana Steiner', role: 'IT', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Pending' },
    { id: 3, name: 'Candice Wu', role: 'Marketing', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active' },
    { id: 4, name: 'Bob Brown', role: 'Human Resources', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Active' },
    { id: 5, name: 'Charlie White', role: 'Member', tags: ['Leadership', 'Assessment', 'Feedback', 'Sales'], assessment: 'Pending' }
  ];

  const handlePageChange = (page: number) => {
    console.log(`Page changed to: ${page}`);
    // Implement your page change logic here
  };

  const handleShowDatePicker = () => {
    console.log('handleShowDatePicker');
    setShowDatePicker(true);
  };

  const handleSetDates = (range) => {
    const start = range.startDate ? range.startDate.toISOString().slice(0, 10) : '';
    const end = range.endDate ? range.endDate.toISOString().slice(0, 10) : '';
    console.log('Formatted start date:', start);
    console.log('Formatted end date:', end);
  };

  const handleOnConfirmDates = () => {
    setShowDatePicker(false);
  };

  return (
    <div className='p-4'>
      <div className='mb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold mb-4'>
          Employees
        </h1>
        <div className='flex justify-between items-center gap-4 mb-4'>
          <div className="flex">
            <button 
              className="py-2 px-6 border border-gray-300 text-black rounded-l-lg font-semibold focus:outline-none"
            >
              12 months
            </button>
            <button 
              className="py-2 px-6 border border-gray-300 text-black font-semibold hover:text-blue-600 hover:border-blue-500 focus:outline-none"
            >
              30 days
            </button>
            <button 
              className="py-2 px-6 border border-gray-300 text-black font-semibold hover:text-blue-600 hover:border-blue-500 focus:outline-none"
            >
              7 days
            </button>
            <button 
              className="py-2 px-6 border border-gray-300 text-black rounded-r-lg font-semibold hover:text-blue-600 hover:border-blue-500 focus:outline-none"
            >
              24 hours
            </button>
          </div>
          <div className='flex gap-4'>
            <div className='relative'>
              <button 
                className="flex gap-2 items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={handleShowDatePicker}
              >
                <Image
                  src="/images/icons/calendar.svg"
                  alt="Calendar Icon"
                  width={20} 
                  height={20}
                  className="rounded-full object-cover"
                />
                Select Dates
              </button>
              {
                showDatePicker &&
                <div className='absolute top-11 right-0 border border-gray-300 rounded-md'>
                  <CalendarRangePicker 
                    onChange={handleSetDates}
                    onConfirm={handleOnConfirmDates}
                  />
                </div>
              }
            </div>
            <button className="flex gap-2 items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
              <Image
                src="/images/icons/filter-lines.svg"
                alt="Calendar Icon"
                width={20} 
                height={20}
                className="rounded-full object-cover"
              />
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      <div>
        <UsersNavBar />
      </div>

      <div className='w-full overflow-x-auto mt-4'>
        <EmployeeList
          employees={employees}
          handlePageChange={handlePageChange}
        />
      </div>

    </div>
  )
}
