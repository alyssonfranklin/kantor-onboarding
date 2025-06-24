"use client";

import NavBar from "@/components/client/NavBar";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
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

          <div className='text-center'>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold my-2">
              Welcome to Voxerion!
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Your account has been successfully created
            </div>
          </div>
            
          <Card className="mt-6 bg-white border border-gray-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Onboarding Complete!
              </h3>
              <p className="text-gray-600 mb-6">
                Your organization has been successfully set up. Please check your email for an activation link to complete your user setup and start using Voxerion.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  <strong>What's next?</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Check your email for the activation link</li>
                  <li>• Click the link to activate your account</li>
                  <li>• Start exploring Voxerion's features</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button className="bg-[#E62E05] hover:bg-[#E62E05]/90 text-white px-8 py-3">
                Go to Login
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600">
            Didn't receive the email?{' '}
            <a 
              href="/contact" 
              className="font-semibold text-[#E62E05] hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}