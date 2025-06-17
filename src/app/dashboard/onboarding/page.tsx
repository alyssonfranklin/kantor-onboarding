"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/hooks";
import { useRouter } from "next/navigation";

/**
 * Login Page
 * 
 * The main login page that uses the auth system.
 * Redirects to dashboard if already authenticated.
 */
export default function OnBoardingPage() {

  const { user } = useAuth();
  const router = useRouter();
  
  const goToSetup = () => {
    router.push('/setup');
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
              You need to setup your environment to start using Voxerion
            </h2>
            <div className='text-gray-600 pt-2 mt-0 text-sm'>
              To ensure insights aligned with your business, share your organization&apos;s details with Voxerion. The quick, 3-minute setup lets your team start receiving insights tailored to your company&apos;s DNA.
            </div>
          </div>

          <Button
            type="button"
            className="w-full mt-28"
            onClick={goToSetup}
          >
            Add Company Information
          </Button>
        </div>
      </div>
      
    </div>
  );
}
