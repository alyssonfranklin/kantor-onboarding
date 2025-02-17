// src/app/page.tsx
"use client"; // This is important!

import CompanyOnboardingForm from '../components/CompanyOnboardingForm';

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <CompanyOnboardingForm />
    </main>
  );
}