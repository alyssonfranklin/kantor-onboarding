"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    role: 'user',
    department: 'Management',
    company_role: 'Employee',
    assistantId: 'default_assistant_id',
    version: '1.0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }
      
      setSuccess('User and company created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        companyName: '',
        role: 'user',
        department: 'Management',
        company_role: 'Employee',
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
      <h1 className="text-3xl font-bold mb-8">Create User and Company</h1>
      
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
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
                <label className="block mb-1 font-medium">Email</label>
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
                <label className="block mb-1 font-medium">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                >
                  <option value="user">User</option>
                  <option value="orgadmin">Organization Admin</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Company Role</label>
                <input
                  type="text"
                  name="company_role"
                  value={formData.company_role}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
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
              
              <div className="md:col-span-2">
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
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create User and Company'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}