import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useAuth } from '@/lib/auth/hooks';
import Image from 'next/image'
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react'

interface Employee {
  name: string;
  email: string;
  role: string;
}

export default function DepartmentAddEmployeesByLeader(
  { leader, employees, addEmployeesToLeader, departmentName }
) {

  const { user } = useAuth();

  const [error, setError] = useState('');
  const [localEmployees, setLocalEmployees] = useState(employees);
  const [first, setFirst] = useState(true);
  const [defaultPassword, setDefaultPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactsError, setContactsError] = useState<
    Array<{ success: boolean; contact: any; error?: any }> | null
  >(null);

  const addEmployee = () => {
    setLocalEmployees([...localEmployees, { name: '', email: '', role: '', saved: false }]);
  };

  const handleRemoveEmployee = (index: number) => {
    const updated = localEmployees.filter((_, i) => i !== index);
    setLocalEmployees(updated);
  };

  const handleChangeEmployee = (index: number, field: keyof Employee, value: string) => {
    const updated = [...localEmployees];
    updated[index][field] = value;
    setLocalEmployees(updated);
  };

  const handleContinue = async () => {
    if (
      localEmployees.length === 0 ||
      localEmployees.some(
        (emp) =>
          !emp.name.trim() ||
          !emp.email.trim() ||
          !emp.role.trim()
      )
    ) {
      setError('Please add at least one employee and fill in all fields (name, email, role) for each.');
      return;
    }

    setError('');
    const results = [];
    setContactsError(null);
    for (const employee of localEmployees) {
      console.log('for of employee: ', employee);
      if (!employee.saved) {
        const data = {
          email: employee.email,
          name: employee.name,
          company_id: user?.company_id,
          password: defaultPassword,
          role: 'user',
          company_role: employee.role,
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

        console.log('add employee responseData: ', responseData);

        if (!response.ok) {
          results.push(
            {
              success: false,
              contact: employee,
              error: responseData.message
            }
          );
        } else {

          setLocalEmployees((prev) =>
            prev.map((c) =>
              c.email === employee.email ? { ...c, saved: true } : c
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
    addEmployeesToLeader(localEmployees);
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
    if (first) {
      setFirst(false);
      getDefaultClientPassword();
    }
  }, [first, getDefaultClientPassword]);

  return (
    <div className="bg-white border-gray-200">
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
              Employees that reports to {leader.name}
            </h2>
              <div className='text-gray-600 pt-0 mt-0'>
                Now it&apos;s time to add the employees to your department. You can accelerate this step by using our{' '}
                <Link
                  href="/dashboard/batch-processing"
                  className="text-[#E62E05] underline font-semibold"
                >
                  template for batch processing
                </Link>.
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
              localEmployees.map((employee, index) => (
              <div
                key={index}
                className="flex items-center gap-2 mt-4"
              >
                <Input
                  placeholder="Name"
                  value={employee.name}
                  onChange={(e) => handleChangeEmployee(index, 'name', e.target.value)}
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
                    value={employee.email}
                    onChange={(e) => handleChangeEmployee(index, 'email', e.target.value)}
                    className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black pl-10 w-full"
                    required={true}
                    name="leaderEmail"
                    type="email"
                  />
                </div>
                <Input
                  placeholder="Role"
                  value={employee.role}
                  onChange={(e) => handleChangeEmployee(index, 'role', e.target.value)}
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white text-black flex-1"
                  required={true}
                  name="role"
                />
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700 p-2 rounded transition-colors"
                  onClick={() => handleRemoveEmployee(index)}
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
                onClick={addEmployee}
              />
              <div 
                className='text-sm cursor-pointer'
                onClick={addEmployee}
              >
                Add another
              </div>
            </div>
          </div>

          <div className="py-4">
            <Button
              type="submit"
              className="w-full"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}
