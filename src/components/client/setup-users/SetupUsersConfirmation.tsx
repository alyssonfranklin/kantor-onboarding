import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react'

export default function SetupUsersConfirmation() {
  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const goToUploadAssessments = () => {
    console.log('goToUploadAssessments');
  };
  
  // If not authenticated, show login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center m-0 p-0">
      <div className="w-full min-h-screen flex justify-center pt-4 md:pt-10">
        <div className='w-11/12 md:w-2/5'>
          <div className='flex justify-center'>
            <Image
              src="/images/icons/cornerstones.svg" 
              alt="Stars Icon" 
              width={32} 
              height={32} 
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Great! Leaders of your department are ready to use Voxerion.
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Your leaders will receive an email with instructions on setting up the Agent. Currently, the insights are powered by our standard engine, using general information about your company. To enhance and personalize these insights further, please upload the Personality Assessments to our platform.
            </div>
          </div>
            
          <div>
            <Button
              type="button"
              className="w-full my-4"
              onClick={goToUploadAssessments}
              variant="outline"
            >
              Upload Personality Assessments
            </Button>
          </div>

          <div>
            <Button
              type="button"
              className="w-full my-4"
              onClick={goToDashboard}
            >
              Know My Dashboard
            </Button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
