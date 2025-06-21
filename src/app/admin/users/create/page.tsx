"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [token, setToken] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    role: 'user',
    department: '',
    company_role: 'Employee',
    assistantId: 'default_assistant_id',
    version: '1.0'
  });

  // Initialize and get authentication token
  useEffect(() => {
    const initializeAndLogin = async () => {
      try {
        // Initialize database
        const initResponse = await fetch('/api/v1/admin/initialize-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        // Login to get token
        const loginResponse = await fetch('/api/v1/verify-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@voxerion.com',
            password: 'admin123'
          }),
        });
        
        const loginData = await loginResponse.json();
        if (loginData.token) {
          setToken(loginData.token);
        } else {
          setError('Failed to authenticate');
        }
      } catch (err) {
        setError('Failed to initialize');
      }
    };
    
    initializeAndLogin();
  }, []);

  // Fetch companies when token is available
  useEffect(() => {
    if (!token) return;
    
    const fetchCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const response = await fetch('/api/v1/companies', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCompanies(result.data || []);
          } else {
            setError('Failed to fetch companies');
          }
        } else {
          setError('Failed to fetch companies');
        }
      } catch (err) {
        setError('Error fetching companies');
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    
    fetchCompanies();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If company is selected, automatically set the assistant ID
    if (name === 'companyName') {
      const selectedCompany = companies.find(company => company.name === value);
      const assistantId = selectedCompany?.assistant_id || 'default_assistant_id';
      setFormData(prev => ({ ...prev, [name]: value, assistantId }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
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
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
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
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Voxerion Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
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
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
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
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Company</label>
                <select
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                  required
                  disabled={isLoadingCompanies}
                >
                  <option value="">
                    {isLoadingCompanies ? 'Loading companies...' : 'Select a company'}
                  </option>
                  {companies.map(company => (
                    <option key={company.company_id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading || isLoadingCompanies}
            >
              {isLoading ? 'Creating...' : 'Create User and Company'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}