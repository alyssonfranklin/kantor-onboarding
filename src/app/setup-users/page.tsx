"use client";

import NavBar from "@/components/client/NavBar";
import DepartmentAddDetails from "@/components/client/setup-users/DepartmentAddDetails";
import DepartmentAddEmployees from "@/components/client/setup-users/DepartmentAddEmployees";
import DepartmentAddEmployeesByLeader from "@/components/client/setup-users/DepartmentAddEmployeesByLeader";
import DepartmentAddLeaders from "@/components/client/setup-users/DepartmentAddLeaders";
import SetupUsersConfirmation from "@/components/client/setup-users/SetupUsersConfirmation";
import SideSteps from "@/components/client/SideSteps";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const TOTAL_STEPS = 3;

export default function LoginPage() {

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    departmentName: '',
    departmentRole: ''
  });
  const [contacts, setContacts] = useState([{ name: '', email: '' }]);
  const [leaders, setLeaders] = useState(
    [
      { 
        id: uuidv4(),
        name: '', 
        email: '', 
        role: '', 
        employees: 
        [
          {
            name: '',
            email: '',
            role: ''
          }
        ] 
      }
    ]
  );
  const [leaderSelected, setLeaderSelected] = useState(null);
  const [employees, setEmployees] = useState<{ name: string; email: string; role: string }[] | null>(null);

  const steps = [
  { 
      id: 1,
      active: false,
      name: "Department/Area Details", 
      description: 'First, create the departments or areas of your company and explain their functions.', 
      icon: '/images/icons/user.svg',
      width: 16,
      height: 18
    },
    { 
      id: 2,
      active: false,
      name: "Department/Area Leaders", 
      description: 'Now, add details about their leaders and specify whom they report to.', 
      icon: '/images/icons/pillars.svg',
      width: 20,
      height: 10
    },
    { 
      id: 3,
      active: false,
      name: "Department/Area Employees", 
      description: 'Lastly, add the employees in the department and indicate whom they report to.', 
      icon: '/images/icons/identity.svg',
      width: 20,
      height: 14
    }
  ];

  const handleContactsChange = (updatedContacts: { name: string; email: string }[]) => {
    setContacts(updatedContacts);
  };

  const handleLeadersChange = (updatedLeaders: { id: string, name: string; email: string; role: string; }[]) => {
    setLeaders(
      updatedLeaders.map(leader => ({
        ...leader,
        employees: leader.hasOwnProperty('employees') ? (leader as any).employees : []
      }))
    );
  };

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

  const onLeaderSelected = (theLeaderId) => {
    console.log('theLeader: ', theLeaderId);
    setLeaderSelected(theLeaderId);
    const leaderIndex = leaders.findIndex((lead: any) => lead.id === theLeaderId);
    console.log('leaderIndex: ', leaderIndex);
    if (leaderIndex >= 0) {
      setEmployees(leaders[leaderIndex].employees);
    }
  };

  const addEmployeesToLeader = (theEmployees) => {
    setLeaders((prevLeaders) =>
      prevLeaders.map((leader) =>
        leader.id === leaderSelected
          ? { ...leader, employees: theEmployees }
          : leader
      )
    );
    setLeaderSelected(null);
    setEmployees(null);
  };

  const handleSubmit = async () => {
    setShowConfirmation(true);
  };
  
  return (
    <>

      {
        !showConfirmation &&
        <div className="w-full min-h-screen flex gap-2">
          <div className="hidden md:block md:w-3/12">
            <SideSteps 
              currentStep={currentStep}
              steps={steps}
            />
          </div>
          <div className="w-full md:w-9/12 flex flex-col items-center justify-center m-0 p-0">
            <div className="w-full min-h-screen flex justify-center pt-0 lg:pt-8">

              {
                currentStep === 1 &&
                <DepartmentAddDetails 
                  setupData={setupData}
                  updateSetupData={updateSetupData}
                  onNext={handleNext}
                  contacts={contacts} 
                  onContactsChange={handleContactsChange}
                />
              }

              {
                currentStep === 2 &&
                <DepartmentAddLeaders 
                  onNext={handleNext}
                  leaders={leaders} 
                  onLeadersChange={handleLeadersChange}
                />
              }

              {
                currentStep === 3 && !leaderSelected &&
                <DepartmentAddEmployees 
                  onNext={handleNext}
                  leaders={leaders}
                  onLeaderSelected={onLeaderSelected}
                />
              }

              {
                currentStep === 3 && leaderSelected &&
                <DepartmentAddEmployeesByLeader 
                  leader={leaderSelected}
                  employees={employees}
                  addEmployeesToLeader={addEmployeesToLeader}
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
          <SetupUsersConfirmation />
        </div>
        
      }

    </>
  );
}
