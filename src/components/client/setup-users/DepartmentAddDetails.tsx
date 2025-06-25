import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import TextArea from '@/components/ui/textArea';
import { useAuth } from '@/lib/auth/hooks';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ModalLoader from '../ModalLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Contact {
  name: string;
  email: string;
}

export default function DepartmentAddDetails(
  { setupData, updateSetupData, onNext, contacts, onContactsChange }
) {

  const { user } = useAuth();

  const [localContacts, setLocalContacts] = useState(contacts);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSetupData({ [name]: value });
  };

  const handleNextClick = async () => {
    console.log('user: ', user);
    if (!setupData.departmentName || !setupData.departmentRole || localContacts.length === 0) {
      setError('All fields are required!');
      return;
    }

    const data = {
      company_id: user?.company_id,
      department_name: setupData.departmentName,
      department_desc: setupData.departmentRole,
      user_head: ''
    };
    console.log('data: ', data);
    const response = await fetch('/api/v1/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data
      })
    });

    setIsSubmitting(false);

    const responseData = await response.json();

    console.log('responseData: ', responseData);

    if (!response.ok) {
      setError(responseData.error || 'Ocurrió un error al guardar la información');
      return;
    }
    onNext();
  };

  const handleChangeContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...localContacts];
    updated[index][field] = value;
    setLocalContacts(updated);
  };

  const addContact = () => {
    setLocalContacts([...localContacts, { name: '', email: '' }]);
  };

  const handleRemoveContact = (index: number) => {
    const updated = localContacts.filter((_, i) => i !== index);
    setLocalContacts(updated);
  };

  useEffect(() => {
    onContactsChange(localContacts);
  }, [localContacts, onContactsChange]);

  return (
    <div className="bg-white border-gray-200">

      {
        isSubmitting &&
        <ModalLoader
          message="Guardando"
        />
      }

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-screen-xl flex flex-wrap justify-center mx-auto px-4">
        <div className="w-full">
          <div className="flex justify-center">
            <Image
              src="/images/icons/key.svg"
              alt="key icon"
              width={28}
              height={28}
              className="inline-block"
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Department/Area Details
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Lets start by adding one department at a time. 
            </div>
          </div>

          <div className="mt-4">
            <Input
              placeholder="Enter the department name"
              value={setupData.departmentName}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black"
              required={true}
              name="departmentName"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="What is the role of this department within the company?"
              value={setupData.departmentRole}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="departmentRole"
            />
          </div>

          <div className="mt-4">
            <div className='w-full text-center text-[#475467]'>
              Who is the head of the Department?
            </div>

            {
              localContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center gap-2 mt-4"
              >
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => handleChangeContact(index, 'name', e.target.value)}
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black flex-1"
                  required={true}
                  name="departmentHeadName"
                />
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Image
                      src="/images/icons/envelope.svg"
                      alt="envelope icon"
                      width={12}
                      height={8}
                      className="inline-block"
                    />
                  </span>
                  <Input
                    placeholder="you@mycompany.com"
                    value={contact.email}
                    onChange={(e) => handleChangeContact(index, 'email', e.target.value)}
                    className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black pl-10 w-full"
                    required={true}
                    name="departmentHeadEmail"
                    type="email"
                  />
                </div>
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 p-2 rounded transition-colors"
                  onClick={() => handleRemoveContact(index)}
                  aria-label="Remove department head"
                >
                  <Image
                    src="/images/icons/trash.svg"
                    alt="trash icon"
                    width={20}
                    height={20}
                    className="inline-block"
                  />
                </button>
              </div>
            ))}
            

            <div className='flex gap-2 justify-start mt-4'>
              <Image
                src="/images/icons/plus.svg"
                alt="envelope icon"
                width={12}
                height={8}
                className="inline-block cursor-pointer"
                onClick={addContact}
              />
              <div 
                className='text-sm cursor-pointer'
                onClick={addContact}
              >
                Add another
              </div>
            </div>
          </div>

          <div className="py-4">
            <Button
              type="submit"
              className="w-full"
              onClick={handleNextClick}
            >
              Continue
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
