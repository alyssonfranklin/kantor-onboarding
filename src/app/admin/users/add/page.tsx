"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function AddUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [token, setToken] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company_id: '',
    password: '',
    version: 'Free',
    role: 'user',
    department: 'General',
    company_role: 'Employee'
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.company_id) {
      setError('Please select a company');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!token) {
        setError('Authentication token not available');
        setIsLoading(false);
        return;
      }

      // Create user with selected company
      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create user');
      }

      setSuccess('User created successfully!');
      // Reset form
      setFormData({
        email: '',
        name: '',
        company_id: '',
        password: '',
        version: 'Free',
        role: 'user',
        department: 'General',
        company_role: 'Employee'
      });
    } catch (error: unknown) {
      const err = error as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full p-2 border rounded-md mb-4 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
  const labelClasses = "block font-bold text-white mb-2";

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add User to Existing Company</h1>
      
      <Card className="max-w-xl mx-auto bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">User Information</CardTitle>
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
              <label htmlFor="company_id" className={labelClasses}>
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                className={inputClasses}
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
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClasses}
                required
                placeholder="user@company.com"
              />
            </div>

            <div>
              <label htmlFor="name" className={labelClasses}>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClasses}
                required
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClasses}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label htmlFor="version" className={labelClasses}>
                Kantor Version
              </label>
              <select
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                className={inputClasses}
                required
              >
                <option value="Free">Free</option>
                <option value="Basic">Basic</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label htmlFor="role" className={labelClasses}>
                User Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={inputClasses}
                required
              >
                <option value="user">User</option>
                <option value="orgadmin">Organization Admin</option>
                <option value="admin">System Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="department" className={labelClasses}>
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={inputClasses}
                required
                placeholder="Department name"
              />
            </div>

            <div>
              <label htmlFor="company_role" className={labelClasses}>
                Company Role
              </label>
              <input
                type="text"
                id="company_role"
                name="company_role"
                value={formData.company_role}
                onChange={handleChange}
                className={inputClasses}
                required
                placeholder="Job title or role"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full font-bold bg-[#E62E05] hover:bg-[#E62E05]/90"
              disabled={isLoading || isLoadingCompanies}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                'Add User to Company'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}