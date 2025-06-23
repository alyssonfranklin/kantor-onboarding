'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_URLS, clientCsrf } from "@/lib/auth/index-client";
import { Button } from '@/components/ui/button';

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

    const response = await fetch(AUTH_URLS.CREATE_AGENT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
				{
					name: companyName
				}
      ),
      credentials: 'include'
    });

    const data = await response.json();
    console.log('response data: ', data);

    if (!response.ok) {
      setError(data.error || 'Create agent failed');
      return;
    }

    const res = await fetch(AUTH_URLS.ADD_USER, {
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
					version: 'Free',
					assistantId: data.id
				}
      ),
      credentials: 'include'
    });

    if (res.ok) {
      router.push('/dashboard'); // Or /admin based on role
      router.refresh(); // To re-evaluate middleware and layouts
    } else {
      const data = await res.json();
      setError(data.error || 'Register failed');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 pt-4 border-none rounded-lg"
    >
      {clientCsrf.hiddenField()}

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
      <Button
        type="submit"
        className="w-full"
      >
        Register
      </Button>
    </form>
  );
}