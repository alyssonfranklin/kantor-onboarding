"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

/**
 * Welcome/Onboarding Page
 * 
 * A placeholder for the user onboarding process.
 * This will be expanded in the future.
 */
export default function WelcomePage() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to Voxerion</h1>
          <p className="text-gray-600 mt-2">Let's get you set up with an account</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div 
                key={index}
                className={`h-2 w-16 mx-1 rounded-full ${
                  index + 1 <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Company information"}
              {step === 3 && "Set up your workspace"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  We'll use this information to set up your personal profile.
                </p>
                
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Work Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="you@company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    Create Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with a number and special character
                  </p>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Tell us about your company to help personalize your experience.
                </p>
                
                <div className="space-y-2">
                  <label htmlFor="companyName" className="block text-sm font-medium">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Acme Inc."
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="companySize" className="block text-sm font-medium">
                    Company Size
                  </label>
                  <select
                    id="companySize"
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select company size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501+">501+ employees</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="industry" className="block text-sm font-medium">
                    Industry
                  </label>
                  <select
                    id="industry"
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select industry</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Let's set up your workspace to match your team's needs.
                </p>
                
                <div className="space-y-2">
                  <label htmlFor="workspaceName" className="block text-sm font-medium">
                    Workspace Name
                  </label>
                  <input
                    id="workspaceName"
                    type="text"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="My Team's Workspace"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="block text-sm font-medium mb-2">
                    What will you use Voxerion for?
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Team collaboration
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Project management
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Document sharing
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      Customer support
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="teamMembers" className="block text-sm font-medium">
                    Invite Team Members (Optional)
                  </label>
                  <textarea
                    id="teamMembers"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter email addresses separated by commas"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    You can also invite team members later
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Back
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="outline">
                  I already have an account
                </Button>
              </Link>
            )}
            
            {step < totalSteps ? (
              <Button onClick={nextStep}>
                Continue
              </Button>
            ) : (
              <Link href="/dashboard">
                <Button>
                  Complete Setup
                </Button>
              </Link>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}