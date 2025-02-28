// src/app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-800 py-16 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-8">Kantor Admin Portal</h1>
        
        <div className="grid gap-6 md:grid-cols-2 mt-12">
          <Link href="/onboarding-company" 
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
            <h2 className="text-xl font-semibold mb-4">Company Onboarding</h2>
            <p className="text-gray-300">Configure company details and update assistant instructions.</p>
            <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
              Go to Form
            </div>
          </Link>

          <Link href="/agent-org-creation" 
            className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-8 flex flex-col items-center justify-center transition-colors">
            <h2 className="text-xl font-semibold mb-4">Agent & User Creation</h2>
            <p className="text-gray-300">Create a new organization with AI agent and admin user.</p>
            <div className="mt-6 bg-[#E62E05] text-white font-bold py-2 px-4 rounded">
              Go to Form
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}