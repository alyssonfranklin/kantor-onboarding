"use client";

import NavBar from "@/components/client/NavBar";
import CornerStones from "@/components/client/setup/CornerStones";
import Identity from "@/components/client/setup/Identity";
import Pillars from "@/components/client/setup/Pillars";
import SetupConfirmation from "@/components/client/setup/SetupConfirmation";
import SideSteps from "@/components/client/SideSteps";
import { useAuth } from "@/lib/auth/index-client";
import { useState } from "react";

const TOTAL_STEPS = 3;

export default function LoginPage() {

  const { user } = useAuth();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    mission: '',
    vision: '',
    coreValues: '',
    companyHistory: '',
    sell: '',
    brand: '',
    practices: '',
    initiatives: ''
  });

  const handleNext = () => {
    setCurrentStep((prevStep) => Math.min(prevStep + 1, TOTAL_STEPS));
    if (currentStep === TOTAL_STEPS) {
      handleSubmit();
    }
  };

  const updateSetupData = (stepData) => {
    setSetupData((prevData) => ({
      ...prevData,
      ...stepData,
    }));
  };

  const handleSubmit = async () => {
    setShowConfirmation(true);

    // const dataToSend = { ...setupData, userId: user?.id };

    // try {
    //   const response = await fetch('/api/submit-setup', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(dataToSend),
    //   });

    //   if (response.ok) {
    //     const result = await response.json();
    //     console.log('Setup successful!', result);
    //     // Redirect or show success message
    //   } else {
    //     const errorData = await response.json();
    //     console.error('Setup failed:', errorData.message || 'Unknown error');
    //     // Handle error, show error message to user
    //   }
    // } catch (error) {
    //   console.error('Error submitting setup:', error);
    //   // Handle network errors
    // }
  };
  
  return (
    <>

      {
        !showConfirmation &&
        <div className="w-full min-h-screen flex gap-2">
          <div className="hidden md:block md:w-4/12">
            <SideSteps 
              currentStep={currentStep}
            />
          </div>
          <div className="w-full md:w-8/12 flex flex-col items-center justify-center m-0 p-0">
            <h1>Step: { currentStep }</h1>
            <div className="w-full min-h-screen flex justify-center pt-0 lg:pt-8">

              {
                currentStep === 1 &&
                <Pillars 
                  setupData={setupData}
                  updateSetupData={updateSetupData}
                  onNext={handleNext}
                />
              }

              {
                currentStep === 2 &&
                <Identity 
                  setupData={setupData}
                  updateSetupData={updateSetupData}
                  onNext={handleNext}
                />
              }

              {
                currentStep === 3 &&
                <CornerStones 
                  setupData={setupData}
                  updateSetupData={updateSetupData}
                  onNext={handleNext}
                />
              }
              
            </div>
          </div>
        </div>
      }

      {
        showConfirmation &&
        <div className="w-full min-h-screen flex flex-col">
          <NavBar 
            hideOptions={true}
          />
          <SetupConfirmation />
        </div>
        
      }

    </>
  );
}
