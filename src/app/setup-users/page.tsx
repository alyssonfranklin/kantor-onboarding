"use client";

import BatchProcessing from "@/components/client/BatchProcessing";
import NavBar from "@/components/client/NavBar";
import DepartmentAddDetails from "@/components/client/setup-users/DepartmentAddDetails";
import DepartmentAddEmployees from "@/components/client/setup-users/DepartmentAddEmployees";
import DepartmentAddEmployeesByLeader from "@/components/client/setup-users/DepartmentAddEmployeesByLeader";
import DepartmentAddLeaders from "@/components/client/setup-users/DepartmentAddLeaders";
import SetupUsersConfirmation from "@/components/client/setup-users/SetupUsersConfirmation";
import SideSteps from "@/components/client/SideSteps";
import EmployeesConfirmation from "@/components/client/users/EmployeesConfirmation";
import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const TOTAL_STEPS = 3;

export default function LoginPage() {

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfirmationBatch, setShowConfirmationBatch] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupData, setSetupData] = useState({
    departmentName: '',
    departmentRole: ''
  });
  const [showBatchProcessing, setShowBatchProcessing] = useState(false);
  const [contacts, setContacts] = useState([{ name: '', email: '', saved: false }]);
  const [finishByUpload, setFinishByUpload] = useState(false);
  const [leaders, setLeaders] = useState(
    [
      { 
        id: uuidv4(),
        name: '', 
        email: '', 
        role: '',
        saved: false,
        employees: 
        [
          {
            name: '',
            email: '',
            role: '',
            saved: false
          }
        ] 
      }
    ]
  );
  const [leaderSelected, setLeaderSelected] = useState(null);
  const [employees, setEmployees] = useState<{ name: string; email: string; role: string }[] | null>(null);
  const [departmentName, setDepartmentName] = useState('');

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

  const handleContactsChange = (updatedContacts: { name: string; email: string, saved: boolean }[]) => {
    setContacts(updatedContacts);
  };

  const handleLeadersChange = (
    updatedLeaders: { id: string, name: string; email: string; role: string; saved: boolean }[]
  ) => {
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

  const handleBatchProcessingClick = () => {
    setShowBatchProcessing(true);
  };

  const onUploadSuccess = () => {
    setFinishByUpload(true);
    setCurrentStep(3);
    setShowConfirmationBatch(true);
  };

  const onSetDepartment = (department) => {
    console.log('department: ', department);
    setDepartmentName(department.department_name);
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
          {
            !showConfirmationBatch &&
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
                    onSetDepartment={onSetDepartment}
                  />
                }

                {
                  currentStep === 2 && !showBatchProcessing &&
                  <DepartmentAddLeaders 
                    title="Department/Area Leaders"
                    onNext={handleNext}
                    leaders={leaders} 
                    onLeadersChange={handleLeadersChange}
                    handleBatchProcessingClick={handleBatchProcessingClick}
                    departmentName={departmentName}
                  />
                }

                {
                  currentStep === 2 && showBatchProcessing &&
                  <BatchProcessing 
                    onUploadSuccess={onUploadSuccess}
                  />
                }

                {
                  currentStep === 3 && !leaderSelected && !finishByUpload &&
                  <DepartmentAddEmployees 
                    onNext={handleNext}
                    onLeaderSelected={onLeaderSelected}
                    leaders={leaders}
                  />
                }

                {
                  currentStep === 3 && leaderSelected && !finishByUpload &&
                  <DepartmentAddEmployeesByLeader 
                    leader={leaderSelected}
                    employees={employees}
                    addEmployeesToLeader={addEmployeesToLeader}
                    departmentName={departmentName}
                  />
                }
                
              </div>
            </div>
          }

          {
            showConfirmationBatch &&
            <EmployeesConfirmation />
          }
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
