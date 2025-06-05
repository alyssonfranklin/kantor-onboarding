'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push('/pages/dashboard'); // Or /admin based on role
      router.refresh(); // To re-evaluate middleware and layouts
    } else {
      const data = await res.json();
      setError(data.message || 'Login failed');
    }
  };

  return (
    <div className='w-11/12 md:w-2/5'>
        <div className='flex justify-center'>
            <Image src="/voxerion-logo.png" alt="Voxerion Logo" width={32} height={32} />
        </div>

        <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
                Log in to your account
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
                Welcome back! Please enter your details.
            </div>
        </div>
        
        <form 
            onSubmit={handleSubmit} 
            className="space-y-4 p-8 border-none rounded-lg"
        >
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
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
                    placeholder='********'
                />
            </div>
            <div className='flex justify-between gap-4'>
                <div>
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                            // You can add state if you want to control this checkbox
                        />
                        <span className="ml-2 text-sm font-semibold text-[#344054]">
                            Remember for 30 days
                        </span>
                    </label>
                </div>
                <div>
                    <a
                        href='/pages/public/reset-password'
                        className="text-sm font-semibold text-[#E62E05] hover:underline"
                    >
                        Forgot password?
                    </a>
                </div>
            </div>
            <button
                type="submit"
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary-500 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Sign in
            </button>
        </form>

        <p className="mt-2 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <a
                href="/pages/public/signup"
                className="font-semibold text-[#E62E05] hover:underline"
            >
                Sign up
            </a>
        </p>
    </div>
  );
}