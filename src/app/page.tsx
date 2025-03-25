// src/app/page.tsx
"use client";

import Link from 'next/link';
import PasswordProtection from '@/components/PasswordProtection';

export default function LandingPage() {
  return (
    <PasswordProtection>
      <main className="min-h-screen bg-gray-800 py-16 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Voxerion Admin Portal</h1>
          
          <div className="grid gap-6 md:grid-cols-2 mt-12">
            <Link href="/agent-org-creation" 
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
              <h2 className="text-xl font-semibold mb-4">Agent & User Creation</h2>
              <p className="text-gray-300">Create a new organization with AI agent and admin user.</p>
              <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
                Go to Form
              </div>
            </Link>

            <Link href="/onboarding-company" 
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
              <h2 className="text-xl font-semibold mb-4">Company Onboarding</h2>
              <p className="text-gray-300">Configure company details and update assistant instructions.</p>
              <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
                Go to Form
              </div>
            </Link>

            <Link href="/upload-assessment" 
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
              <h2 className="text-xl font-semibold mb-4">Upload Assessment Files</h2>
              <p className="text-gray-300">Add files to an assistant&apos;s vector database for file search.</p>
              <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
                Go to Form
              </div>
            </Link>

            <Link href="/create-assistant" 
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
              <h2 className="text-xl font-semibold mb-4">Upload Assessment Files v2</h2>
              <p className="text-gray-300">Add files to an assistant&apos;s vector database for file search.</p>
              <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
                Go to Form
              </div>
            </Link>
          </div>
          
          <div className="mt-16 border-t border-gray-600 pt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Database Management</h2>
            
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              <Link href="/admin/initialize-db" 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Initialize Database</h3>
                <p className="text-gray-300 text-sm">Set up the database structure and create admin user.</p>
              </Link>
              
              <Link href="/admin/users/create" 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Create User</h3>
                <p className="text-gray-300 text-sm">Add new users to the system.</p>
              </Link>
              
              <Link href="/admin/companies/create" 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Create Company</h3>
                <p className="text-gray-300 text-sm">Add new companies to the system.</p>
              </Link>
              
              <Link href="/admin/departments/create" 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Create Department</h3>
                <p className="text-gray-300 text-sm">Add new departments to companies.</p>
              </Link>
              
              <Link href="/admin/employees/create" 
                className="bg-blue-800 hover:bg-blue-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Create Employee</h3>
                <p className="text-gray-300 text-sm">Add new employees to companies.</p>
              </Link>
              
              <Link href="/admin" 
                className="bg-green-800 hover:bg-green-700 text-white rounded-lg p-6 flex flex-col items-center justify-center transition-colors">
                <h3 className="text-lg font-semibold mb-2">Admin Dashboard</h3>
                <p className="text-gray-300 text-sm">Access all administration features.</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </PasswordProtection>
  );
}