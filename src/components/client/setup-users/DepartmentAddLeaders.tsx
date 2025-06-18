import { Button } from '@/components/ui/button';
import Input from '@/components/ui/input';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';

interface Leader {
  name: string;
  email: string;
  role: string;
}

export default function DepartmentAddLeaders(
  { leaders, onLeadersChange, onNext }
) {

  const [error, setError] = useState('');
  const [localLeaders, setLocalLeaders] = useState(leaders);

  const handleNextClick = () => {
    if (localLeaders.length === 0) {
      setError('At least one leader is required!');
      return;
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

  useEffect(() => {
    onLeadersChange(localLeaders);
  }, [localLeaders]);

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
              Department/Area Leaders
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Leaders are the power users of Voxerion. They take advantage of the insights for better communication, leadership advice, and more. You can accelerate this step by using our template for batch processing.
            </div>
          </div>

          {error && (
            <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
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
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white flex-1"
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
                    className="border-[#D0D5DD] placeholder:text-[#667085] bg-white pl-10 w-full"
                    required={true}
                    name="leaderEmail"
                    type="email"
                  />
                </div>
                <Input
                  placeholder="Role"
                  value={leader.role}
                  onChange={(e) => handleChangeLeader(index, 'role', e.target.value)}
                  className="border-[#D0D5DD] placeholder:text-[#667085] bg-white flex-1"
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
