"use client"

import Image from "next/image";
import React from "react";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function SideSteps(
  { currentStep, steps }
) {

  const router = useRouter();

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <aside className="flex flex-col h-screen w-auto bg-[#F9FAFB] border-r shadow-sm">
      {/* Top: Logo and App Name */}
      <div className="flex items-center gap-3 h-20 px-6">
        <Image 
          src="/voxerion-logo.png" 
          alt="Voxerion Logo" 
          width={30} 
          height={30} 
        />
        <span className="text-xl font-bold text-gray-800">
          <Image 
            src="/voxerion.svg" 
            alt="Voxerion" 
            width={60} 
            height={13} 
          />
        </span>
      </div>


      {/* Menu Options */}
      <nav className="flex-1 px-4 py-6 space-y-2" style={{width: '300px'}} >
        <ul className="space-y-0">
          {steps.map((step, idx) => (
            <li key={step.name} className="flex items-start gap-4 group">
              <div className="flex flex-col items-center">
                <div className="border border-gray-200 p-4 rounded-lg shadow-lg">
                  <span 
                    className={`flex items-center justify-center w-8 h-8 rounded-full bg-white group-hover:bg-blue-200 transition ${step.id === currentStep ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <Image src={step.icon} alt={step.name} width={24} height={24} />
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <span className="w-px h-8 bg-gray-300 mt-0"></span>
                )}
              </div>
              <div className="pb-4">
                <div className={`font-semibold text-sm ${step.id === currentStep ? 'text-gray-800' : 'text-gray-400'}`}>{step.name}</div>
                <div className={`text-xs ${step.id === currentStep ? 'text-gray-800' : 'text-gray-400'}`}>{step.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </nav>


      {/* Bottom Options */}
      <div className="px-4 pb-4">
        <div className="space-y-1 mb-4 flex justify-center">
          <Button
            type="button"
            className="w-full border-[#FF9C66] bg-white text-[#E62E05]"
            variant={'outline'}
            onClick={goToDashboard}
          >
            Back to Dashboard
          </Button>
        </div>
        <div className="flex justify-between items-center gap-1 py-2 transition">
          <div className="p-0 m-0 text-xs">
            &copy; Voxerion 2025
          </div>
          <div className="flex items-center gap-1">
            <div>
              <Image 
                src="/images/icons/envelope.svg" 
                alt="help@Voxerion-app.com" 
                width={13} 
                height={13} 
              />
            </div>
            <div className="text-xs p-0 m-0">
              help@voxerion-app.com
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
