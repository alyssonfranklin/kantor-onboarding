'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';

export default function InitializeDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const handleInitializeDb = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/admin/initialize-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Database initialized successfully!');
      } else {
        setError(data.error || 'Failed to initialize database');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error initializing database:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Initialize Database</h1>
      
      <Card className="p-6 max-w-2xl mx-auto">
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            {success}
          </Alert>
        )}
        
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-semibold mb-2">Database Initialization</h2>
            <p className="text-gray-600">
              This will initialize the database with the default structure. If a database already exists,
              this will NOT overwrite it, but will ensure all required collections and indexes are set up.
            </p>
          </div>
          
          <div className="space-y-4">
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <div className="flex items-start">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2 mt-0.5 text-amber-600" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <div>
                  <strong>Important:</strong> Make sure you know what you're doing! This is typically only needed when setting up the application for the first time.
                </div>
              </div>
            </Alert>
            
            <Button
              onClick={handleInitializeDb}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Initializing...' : 'Initialize Database'}
            </Button>
          </div>
          
          <div className="border-t pt-4 mt-6">
            <p className="text-sm text-gray-500 mb-4">
              After initialization, you can start creating companies and users through the admin dashboard.
            </p>
            <Link href="/admin" className="text-blue-600 hover:underline">
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}