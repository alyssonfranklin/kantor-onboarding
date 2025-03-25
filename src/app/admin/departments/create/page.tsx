"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateDepartmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    company_id: '',
    department_name: '',
    department_desc: '',
    user_head: ''
  });

  useEffect(() => {
    // In a real implementation, fetch companies from the API
    // For demo purposes, we're using a placeholder
    setCompanies([
      { company_id: 'COMP_0001', name: 'Voxerion Inc.' },
      { company_id: 'COMP_0002', name: 'Acme Corp' },
    ]);
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      setIsLoadingUsers(true);
      // In a real implementation, fetch users for the selected company
      // For demo purposes, we're using placeholders
      setTimeout(() => {
        setUsers([
          { id: 'USER_0001', name: 'John Doe', email: 'john@example.com' },
          { id: 'USER_0002', name: 'Jane Smith', email: 'jane@example.com' },
        ]);
        setIsLoadingUsers(false);
      }, 500);
    }
  }, [selectedCompany]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'company_id') {
      setSelectedCompany(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // This would be a real API call in production
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // In real app, get from auth
        },
        body: JSON.stringify(formData),
      });
      
      // Mock successful response for demo
      setSuccess('Department created successfully!');
      setFormData({
        company_id: '',
        department_name: '',
        department_desc: '',
        user_head: ''
      });
      setSelectedCompany('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Create Department</h1>
      
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Department Information</CardTitle>
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
              <label className="block mb-1 font-medium">Company</label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              >
                <option value="">Select a company</option>
                {companies.map(company => (
                  <option key={company.company_id} value={company.company_id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Department Name</label>
              <input
                type="text"
                name="department_name"
                value={formData.department_name}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                required
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                name="department_desc"
                value={formData.department_desc}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 h-24"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Department Head</label>
              <select
                name="user_head"
                value={formData.user_head}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              >
                <option value="">Select a department head</option>
                {isLoadingUsers ? (
                  <option disabled>Loading users...</option>
                ) : (
                  users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Department'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}