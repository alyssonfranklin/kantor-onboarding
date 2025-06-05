'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Assistant } from 'next/font/google';

export default function RegisterForm() {

	const [name, setName] = useState('');
  const [email, setEmail] = useState('');
	const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

		if (password !== passwordConfirm) {
			setError('Password confirm invalid');
			return;
		}

    const res = await fetch('/api/add-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
				{
					name, 
					email,
					companyName,
					password,
					version: '1.0',
					assistantId: 1
				}),
    });

    if (res.ok) {
      router.push('/pages'); // Or /admin based on role
      router.refresh(); // To re-evaluate middleware and layouts
    } else {
      const data = await res.json();
			console.log('data: ', data);
      setError(data.error || 'Register failed');
    }
  };

  return (
    <div className='w-2/5'>
        <div className='flex justify-center'>
            <Image src="/voxerion-logo.png" alt="Voxerion Logo" width={32} height={32} />
        </div>

        <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
                Register
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
                Fill information below
            </div>
        </div>
        
        <form 
            onSubmit={handleSubmit} 
            className="space-y-4 p-8 border-none rounded-lg"
        >
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            <div>
                <label 
                    htmlFor="name" 
                    className="block text-sm font-medium text-gray-700"
                >
                    Full Name
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder='Enter your full name'
                />
            </div>

            <div>
                <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-700"
                >
                    Email
                </label>
                <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder='Enter your email'
                />
            </div>

						<div>
                <label 
                    htmlFor="company" 
                    className="block text-sm font-medium text-gray-700"
                >
                    Company
                </label>
                <input
                    type="text"
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder='Enter your company'
                />
            </div>

            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                >
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder="Enter your password"
                />
            </div>
            <div>
                <label
                    htmlFor="passwordConfirm"
                    className="block text-sm font-medium text-gray-700"
                >
                    Confirm Password
                </label>
                <input
                    type="password"
                    id="passwordConfirm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    placeholder="Confirm your password"
                />
            </div>
            
            <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Register
            </button>
        </form>

    </div>
  );
}