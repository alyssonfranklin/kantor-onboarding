"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";

/**
 * Login Page
 * 
 * The main login page that uses the auth system.
 * Redirects to dashboard if already authenticated.
 */
export default function SetupConfirmation() {
  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };
  
  // If not authenticated, show login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center m-0 p-0">
      <div className="w-full min-h-screen flex justify-center pt-4 md:pt-10">
        <div className='w-11/12 md:w-2/5'>
          <div className='flex justify-center'>
            <Image
              src="/voxerion-logo.png" 
              alt="Voxerion Logo" 
              width={32} 
              height={32} 
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Perfect! Your information has helped Voxerion understand your company better.
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Now, based on the employee assessments, Voxerion is ready to support your team with insights perfectly aligned to your company’s goals and culture.
            </div>
          </div>
            
          <Button
            type="button"
            className="w-full my-6"
            onClick={goToDashboard}
          >
            Back to my Dashboard
          </Button>

          
        </div>
      </div>
    </div>
  );
}
