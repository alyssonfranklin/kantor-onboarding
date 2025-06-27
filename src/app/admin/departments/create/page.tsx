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
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [token, setToken] = useState('');
  
  const [formData, setFormData] = useState({
    company_id: '',
    department_name: '',
    department_description: '',
    department_lead: ''
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

  // Fetch users when company is selected
  useEffect(() => {
    if (selectedCompany && token) {
      setIsLoadingUsers(true);
      setUsers([]); // Clear previous users
      
      const fetchUsers = async () => {
        try {
          const response = await fetch(`/api/v1/users?companyId=${selectedCompany}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setUsers(result.data || []);
            } else {
              setError('Failed to fetch users for selected company');
            }
          } else {
            setError('Failed to fetch users for selected company');
          }
        } catch (err) {
          setError('Error fetching users for selected company');
        } finally {
          setIsLoadingUsers(false);
        }
      };
      
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [selectedCompany, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'company_id') {
      setSelectedCompany(value);
      // Clear department_lead when company changes
      setFormData(prev => ({ ...prev, [name]: value, department_lead: '' }));
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
      if (!token) {
        setError('Authentication token not available');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess('Department created successfully!');
        setFormData({
          company_id: '',
          department_name: '',
          department_description: '',
          department_lead: ''
        });
        setSelectedCompany('');
      } else {
        setError(result.message || 'Failed to create department');
      }
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
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                required
                disabled={isLoadingCompanies}
              >
                <option value="">
                  {isLoadingCompanies ? 'Loading companies...' : 'Select a company'}
                </option>
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
                name="department_description"
                value={formData.department_description}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 h-24 text-white"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Department Head</label>
              <select
                name="department_lead"
                value={formData.department_lead}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                disabled={isLoadingUsers || !selectedCompany}
              >
                <option value="">
                  {isLoadingUsers 
                    ? 'Loading users...' 
                    : !selectedCompany 
                      ? 'Select a company first'
                      : 'Select a department head'
                  }
                </option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
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