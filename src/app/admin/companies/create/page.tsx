"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateCompanyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    assistantId: 'default_assistant_id',
    version: '1.0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/v1/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'orgadmin',
          department: 'Management',
          company_role: 'Admin'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create company');
      }
      
      setSuccess('Company created successfully with admin user!');
      setFormData({
        name: '',
        email: '',
        password: '',
        companyName: '',
        assistantId: 'default_assistant_id',
        version: '1.0'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create Company</h1>
      
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          {success && (
            <Alert className="mb-4 bg-green-800 border-green-600">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="mb-4 bg-red-800 border-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Assistant ID (OpenAI)</label>
              <input
                type="text"
                name="assistantId"
                value={formData.assistantId}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Admin User</h3>
            <p className="text-sm text-gray-400 mb-4">Every company needs an admin user to manage it.</p>
            
            <div>
              <label className="block mb-1 font-medium">Admin Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Admin Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Admin Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Company with Admin'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}