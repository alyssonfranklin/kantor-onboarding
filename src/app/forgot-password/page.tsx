"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import NavBar from "@/components/client/NavBar";
import Image from "next/image";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { useRouter } from "next/navigation";

/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset link.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const router = useRouter();

  const handleSuccess = (email: string, resetUrl?: string) => {
    setEmail(email);
    setIsSubmitted(true);
    if (resetUrl) {
      setResetUrl(resetUrl);
    }
  };

  const goLogin = () => {
    router.push("/login");
  };

  const resendLink = () => {
    
  };
  
  // Show the password reset request form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center m-0 p-0">
      <div className="w-full">
        <NavBar />
      </div>
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

          {
            !isSubmitted &&
            <>
              <div className='text-center'>
                <h2 className="text-2xl font-bold my-2">
                  Reset your password
                </h2>
                <div className='text-gray-600 pt-0 mt-0'>
                  Can&apos;t remember your password? Enter your email address and we will send you an email to create a new password.
                </div>
              </div>
                
              <ResetPasswordForm
                onHandleSuccess={handleSuccess}
              />

              <p className="mt-2 text-center text-sm text-gray-600">
                Don&apos;t have an account?{'  '}
                <Link
                  href="/signup"
                  className="font-semibold text-[#E62E05] hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </>
          }

          {
            isSubmitted &&
            <>
              <div className='text-center'>
                <h2 className="text-2xl font-bold my-2">
                  Reset your password
                </h2>
                <div className='text-gray-600 pt-0 mt-0'>
                  If an account exists for that email address, we have sent you an email with a link to reset your password.
                </div>
              </div>
              
              <div className="py-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={goLogin}
                >
                  Log in
                </Button>
              </div>

              <p className="mt-2 text-center text-sm text-gray-600">
                Didn&apos;t receive an email?{'  '}
                <Link
                  href="#"
                  className="font-semibold text-[#E62E05] hover:underline"
                  onClick={resendLink}
                >
                  Resend
                </Link>
              </p>

            </>
          }

        </div>
      </div>
    </div>
  );
}