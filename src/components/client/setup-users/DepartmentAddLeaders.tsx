import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import ModalLoader from '../ModalLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/hooks';

interface Leader {
  name: string;
  email: string;
  role: string;
}

export default function DepartmentAddLeaders(
  { leaders, onLeadersChange, onNext, title, handleBatchProcessingClick, departmentName }
) {

  const { user } = useAuth();

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLeaders, setLocalLeaders] = useState(leaders);
  const [defaultPassword, setDefaultPassword] = useState('');
  const [first, setFirst] = useState(true);
  const [contactsError, setContactsError] = useState<
      Array<{ success: boolean; contact: any; error?: any }> | null
    >(null);

  const handleNextClick = async () => {
    if (localLeaders.length === 0) {
      setError('At least one leader is required!');
      return;
    }

    const hasEmptyFields = localLeaders.some(
      (leader) => !leader.name.trim() || !leader.email.trim() || !leader.role.trim()
    );
    if (hasEmptyFields) {
      setError('Each leader must have a name, email, and role.');
      return;
    }

    const results = [];
    setContactsError([]);
    for (const leader of localLeaders) {
      console.log('for of leader: ', leader);
      if (!leader.saved) {
        const data = {
          email: leader.email,
          name: leader.name,
          company_id: user?.company_id,
          password: defaultPassword,
          role: 'user',
          company_role: leader.role,
          department: departmentName
        };
        setIsSubmitting(true);
        const response = await fetch('/api/v1/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        setIsSubmitting(false);

        const responseData = await response.json();

        if (!response.ok) {
          results.push(
            {
              success: false,
              contact: leader,
              error: responseData.message
            }
          );
        } else {

          setLocalLeaders((prev) =>
            prev.map((c) =>
              c.email === leader.email ? { ...c, saved: true } : c
            )
          );

          results.push(
            {
              success: true,
              contact: responseData.data
            }
          );
        }

        const failedContacts = results.filter(r => r.success === false);

        if (failedContacts.length > 0) {
          setContactsError(failedContacts);
          return;
        }
      }
      
    }
    
    onNext();
  };

  const handleChangeLeader = (index: number, field: keyof Leader, value: string) => {
    const updated = [...localLeaders];
    updated[index][field] = value;
    setLocalLeaders(updated);
  };
  
  const addLeader = () => {
    const id = uuidv4();
    setLocalLeaders([...localLeaders, { id: id, name: '', email: '', role: '' }]);
  };

  const handleRemoveLeader = (index: number) => {
    const updated = localLeaders.filter((_, i) => i !== index);
    setLocalLeaders(updated);
  };

  const getDefaultClientPassword = useCallback(
    async () => {
      const response = await fetch('/api/v1/auth/default-password', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        setError(responseData.error || 'Ocurrió un error al obtener la configuración');
        return;
      }

      setDefaultPassword(responseData.defaultClientPassword);
    },
    [],
  )

  useEffect(() => {
    onLeadersChange(localLeaders);
    if (first) {
      setFirst(false);
      getDefaultClientPassword();
    }
  }, [first, getDefaultClientPassword, localLeaders]);

  return (
    <div className="bg-white border-gray-200">

      {
        isSubmitting &&
        <ModalLoader
          message="Guardando"
        />
      }

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
              { title }
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Leaders are the power users of Voxerion. They take advantage of the insights for better communication, leadership advice, and more. You can accelerate this step by using our {' '}
                <span
                  onClick={handleBatchProcessingClick}
                  className="text-[#E62E05] underline font-semibold cursor-pointer"
                >
                  template for batch processing
                </span>.
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {contactsError && (
            <Alert variant="destructive">
              { contactsError && contactsError.map((r, index) => (
                <AlertDescription key={index}>
                  {r.contact.email}: {r.error}
                </AlertDescription>
              ))
            }
            </Alert>
          )}

          <div className="mt-4">
            {
              localLeaders.map((leader, index) => (
              <div
                key={index}
                className="flex items-center gap-2 mt-4"
              >
                <Input
                  placeholder="Name"
                  value={leader.name}
                  onChange={(e) => handleChangeLeader(index, 'name', e.target.value)}
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black flex-1"
                  required={true}
                  name="name"
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
                    value={leader.email}
                    onChange={(e) => handleChangeLeader(index, 'email', e.target.value)}
                    className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black pl-10 w-full"
                    required={true}
                    name="leaderEmail"
                    type="email"
                  />
                </div>
                <Input
                  placeholder="Role"
                  value={leader.role}
                  onChange={(e) => handleChangeLeader(index, 'role', e.target.value)}
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black flex-1"
                  required={true}
                  name="role"
                />
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 p-2 rounded transition-colors"
                  onClick={() => handleRemoveLeader(index)}
                  aria-label="Remove leader"
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
                onClick={addLeader}
              />
              <div 
                className='text-sm cursor-pointer'
                onClick={addLeader}
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
