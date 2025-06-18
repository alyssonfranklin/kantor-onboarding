"use client"

import CardUploadAssessment from '@/components/client/CardUploadAssessment'
import Image from 'next/image'
import React from 'react'

export default function UploadAssessmentsPage() {

  const handleFilesChange = (files) => {
    console.log('Selected files:', files);
    // You can handle the files here, e.g., send them to an API or process them
  };

  return (
    <div className='p-4'>
      <div className='mb-4 border-b border-gray-200'>
        <h1 className='text-2xl font-bold mb-4'>
          Upload Employee Assessments & other Inputs
        </h1>
      </div>

      <div className="flex justify-center w-full mt-4">
        <div className='w-11/12 md:w-3/5'>
          <div className='flex justify-center mt-2'>
            <div className='p-4 border border-gray-300 shadow-md rounded-lg'>
              <Image
                src="/images/icons/key.svg" 
                alt="Key Icon" 
                width={25} 
                height={25} 
              />
            </div>
          </div>

          <div className='text-center mt-4'>
            <h2 className="text-2xl font-bold my-2">
              Upload your Assessments
            </h2>
            <div className='text-gray-600 pt-2 mt-0 text-normal'>
              Please upload your employees and leaders. Our engine will update the status for every employee into the assessment repository.
            </div>
          </div>

          <div className='flex justify-center mt-6'>
            <CardUploadAssessment 
              title="Upload Employee and Leaders Assessment"
              description="Please upload the file using the CSV format. The filesize has to be is under 25 MB. Please make sure to upload up to 10 files each time."
              onFilesChange={handleFilesChange}
            />
          </div>

        </div>
      </div>

    </div>
  )
}
