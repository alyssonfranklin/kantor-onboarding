"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/hooks";
import { useRouter } from "next/navigation";

/**
 * OnBoarding Page
 * 
 * The main onboarding page for setup departments.
 */
export default function OnBoardingPage() {

  const { user } = useAuth();
  const router = useRouter();
  
  const goToSetup = () => {
    router.push('/setup-users');
  };
  
  return (
    <div className="w-full min-h-screen md:pt-4">
      <div>
        <span className="text-2xl font-bold px-4">
          Welcome, {user?.name}!
        </span>
      </div>
      <div className="flex justify-center w-full mt-10">
        <div className='w-11/12 md:w-2/5'>
          <div className='flex justify-center mt-8'>
            <Image
              src="/voxerion-logo.png" 
              alt="Voxerion Logo" 
              width={32} 
              height={32} 
            />
          </div>

          <div className='text-center mt-8'>
            <h2 className="text-2xl font-bold my-2">
              Your company data is ready. Set up Users and Departments to start using your Agent.
            </h2>
            <div className='text-gray-600 pt-2 mt-0 text-sm'>
              Departments help Voxerion determine who can receive insights, ensuring that sensitive information stays within the right teams.
            </div>
          </div>

          <Button
            type="button"
            className="w-full mt-28"
            onClick={goToSetup}
          >
            Add Departments
          </Button>
        </div>
      </div>
      
    </div>
  );
}
