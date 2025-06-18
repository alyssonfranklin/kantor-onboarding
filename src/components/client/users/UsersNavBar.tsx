import { Button } from '@/components/ui/button'
import React from 'react'

export default function UsersNavBar() {
  return (
    <div className='flex justify-between gap-4'>
      <div>
        <div className="flex">
          <button 
            className="py-2 px-6 border border-gray-300 text-black rounded-l-lg font-semibold focus:outline-none"
          >
            By Department
          </button>
          <button 
            className="py-2 px-6 border border-gray-300 text-black font-semibold hover:text-blue-600 hover:border-blue-500 focus:outline-none"
          >
            By Status
          </button>
          <button 
            className="py-2 px-6 border border-gray-300 text-black rounded-r-lg font-semibold hover:text-blue-600 hover:border-blue-500 focus:outline-none"
          >
            Utilization
          </button>
        </div>
      </div>
      <div className='flex gap-4'>
        <Button
          type="button"
          className="w-full font-bold border-[#FF9C66] text-[#E62E05] hover:border-[#FF9C66]/90"
          variant={'outline'}
        >
          Create User
        </Button>
        <Button 
          type="button" 
          className="w-full font-bold bg-[#E62E05] text-white hover:bg-[#E62E05]/90"
        >
          Upload Assessments
        </Button>
      </div>
    </div>
  )
}
