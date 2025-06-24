import BillingList from '@/components/client/billings/BillingList'
import Image from 'next/image'
import React from 'react'

export default function BillingsPage() {

  const billings = [
    {
      id: '1',
      date: new Date('01/25/2025'),
      description: 'January 2025 Payment',
      users: 8,
      employees: 350,
      total: 15.00,
      status: 'Paid',
      account: {
        brandImage: '/images/icons/visa.svg',
        brand: 'VISA',
        expiration: '06/2025',
        lastDigits: '1234'
      }
    },
    {
      id: '2',
      date: new Date('12/26/2024 '),
      description: 'December 2024 Payment',
      users: 8,
      employees: 320,
      total: 15.00,
      status: 'Paid',
      account: {
        brandImage: '/images/icons/mastercard.svg',
        brand: 'MasterCard',
        expiration: '06/2025',
        lastDigits: '1234'
      }
    }
  ];

  return (
    <div className='p-8'>
      <div className='mb-4'>
        <h1 className='text-2xl font-bold mb-4'>
          Billings
        </h1>
      </div>
      <div>
        <p className='text-[#475467] mb-4'>
          On this page you can see all your payments and relative information about the invoices and transactions. Please{' '}
          <a href="/contact" className="text-[#E62E05] font-semibold underline hover:text-orange-600">
            Contact Us
          </a>
          {' '}if you have any questions
        </p>
      </div>

      <div className='flex justify-between items-center mb-4'>
        <div className='text-black font-semibold text-lg'>
          Transaction history
        </div>
        <div className='flex gap-4'>
          <button className="flex gap-2 items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500">
            <Image
              src="/images/icons/calendar.svg"
              alt="Calendar Icon"
              width={20} 
              height={20}
              className="rounded-full object-cover"
            />
            Select Dates
          </button>
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

      <div>
        <BillingList
          billings={billings}
        />
      </div>

    </div>
  )
}
