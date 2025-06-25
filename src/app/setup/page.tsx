"use client";

import ModalLoader from "@/components/client/ModalLoader";
import NavBar from "@/components/client/NavBar";
import CornerStones from "@/components/client/setup/CornerStones";
import Identity from "@/components/client/setup/Identity";
import Pillars from "@/components/client/setup/Pillars";
import SetupConfirmation from "@/components/client/setup/SetupConfirmation";
import SideSteps from "@/components/client/SideSteps";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { clientCsrf } from "@/lib/auth/csrf-client";
import { useAuth } from "@/lib/auth/hooks";
import { Assistant } from "next/font/google";
import { useCallback, useEffect, useState } from "react";

const TOTAL_STEPS = 3;

export default function LoginPage() {

  const { user } = useAuth();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    standardPrompt: 'onboarding company',
    mission: '',
    vision: '',
    coreValues: '',
    companyHistory: '',
    sell: '',
    brand: '',
    practices: '',
    initiatives: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState({assistant_id: ''});

  const steps = [
  { 
      id: 1,
      active: false,
      name: "Organizational Pillars", 
      description: 'Vision, Mission and Core Values', 
      icon: '/images/icons/pillars.svg',
      width: 40,
      height: 20
    },
    { 
      id: 2,
      active: false,
      name: "Corporate Identity", 
      description: 'History of your company, what it does, and brand identity', 
      icon: '/images/icons/identity.svg',
      width: 80,
      height: 60
    },
    { 
      id: 3,
      active: false,
      name: "Cultural Cornerstones", 
      description: 'Corporate cultural aspects and social responsibility', 
      icon: '/images/icons/cornerstones.svg',
      width: 20,
      height: 20
    }
  ];

  const getCompany = useCallback(
    async () => {
      const headers = clientCsrf.addToHeaders({
        'Content-Type': 'application/json'
      });

      console.log('getCompany headers: ', headers);

      const response = await fetch(`/api/v1/companies/${user?.company_id}`, {
        method: 'GET',
        headers
      });

      const responseData = await response.json();

      console.log('responseData: ', responseData);

      if (!response.ok) {
        setError(responseData.error || 'No se encontró la información de la compañía');
        return;
      }

      setCompany(responseData.data);

    },
    [user?.company_id],
  );
  

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

  const handleSubmit = useCallback( async () => {
      setIsSubmitting(true);
      setError('');
      setShowConfirmation(false);
      try {
        let instructions = '';
        instructions += `[PROPÓSITO DO AGENTE]\n${setupData.standardPrompt}\n\n`;
        instructions += `[MISSAO DO CLIENTE]\n${setupData.mission}\n\n`;
        instructions += `[VISAO DO CLIENTE]\n${setupData.vision}\n\n`;
        instructions += `[VALORES FUNDAMENTAIS DO CLIENTE]\n${setupData.coreValues}\n\n`;
        instructions += `[HISTORIA DO CLIENTE]\n${setupData.companyHistory}\n\n`;
        instructions += `[O QUE VENDE O CLIENTE]\n${setupData.sell}\n\n`;
        instructions += `[BRANDING E PROMESSAS DE MARCA]\n${setupData.brand}`;

        console.log('company: ', company);
        
        const response = await fetch('/api/v1/update-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instructions,
            assistantId: company?.assistant_id
          })
        });

        setIsSubmitting(false);

        const responseData = await response.json();

        if (!response.ok) {
          setError(responseData.error || 'Ocurrió un error al guardar la información');
          return;
        }

        setIsSubmitting(false);
        setShowConfirmation(true);
      } catch (error) {
        let errorMessage = 'Ocurrió un error al guardar la información';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (typeof error === 'object' && error !== null && 'toString' in error) {
          errorMessage = error.toString();
        }
        setError(errorMessage);
        setIsSubmitting(false);
      }
    },
    [company, setupData]
  );

  useEffect(() => {
    console.log('user: ', user);
    console.log('company: ', company);
    if (company.assistant_id === '') {
      getCompany();
    }
    return () => {
      
    };
  }, [company, getCompany, user]);

  return (
    <>

      {
        isSubmitting &&
        <ModalLoader
          message="Guardando"
        />
      }

      {
        !showConfirmation &&
        <div className="w-full min-h-screen flex gap-2">
          <div className="hidden md:block md:w-4/12">
            <SideSteps 
              currentStep={currentStep}
              steps={steps}
            />
          </div>
          <div className="w-full md:w-8/12 flex flex-col items-center justify-center m-0 p-0">

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
