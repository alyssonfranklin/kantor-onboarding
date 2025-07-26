// src/app/onboarding-company/page.tsx
"use client";

import CompanyOnboardingForm from '@/components/CompanyOnboardingForm';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingCompanyPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <main className="min-h-screen bg-gray-800 py-8 px-4">
        <div className="max-w-4xl mx-auto mb-6">
          <Link href="/" className="text-white hover:text-gray-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to HomeZZ
          </Link>
        </div>
        <CompanyOnboardingForm />
      </main>
    </ProtectedRoute>
  );
}