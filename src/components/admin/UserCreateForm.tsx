'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

type Company = {
  company_id: string;
  name: string;
};

export function UserCreateForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company_id: '',
    role: 'user', // default role
    department: '',
    company_role: '',
    password: '',
    confirmPassword: '',
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        const data = await response.json();
        if (response.ok) {
          setCompanies(data);
        } else {
          console.error('Failed to fetch companies:', data.error);
          setCompanies([]);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        setCompanies([]);
      }
    };
    
    fetchCompanies();
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Remove confirmPassword from data sent to API
      const { confirmPassword, ...dataToSend } = formData;
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('User created successfully!');
        // Reset form
        setFormData({
          email: '',
          name: '',
          company_id: '',
          role: 'user',
          department: '',
          company_role: '',
          password: '',
          confirmPassword: '',
        });
        
        // Redirect to user list after 2 seconds
        setTimeout(() => {
          router.push('/admin/users');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="user@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="company_id" className="block text-sm font-medium">
              Company <span className="text-red-500">*</span>
            </label>
            <select
              id="company_id"
              name="company_id"
              required
              value={formData.company_id}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a company</option>
              {companies.map(company => (
                <option key={company.company_id} value={company.company_id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium">
              System Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="user">User</option>
              <option value="orgadmin">Organization Admin</option>
              <option value="admin">System Admin</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="department" className="block text-sm font-medium">
              Department
            </label>
            <input
              id="department"
              name="department"
              type="text"
              value={formData.department}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Engineering"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="company_role" className="block text-sm font-medium">
              Company Role
            </label>
            <input
              id="company_role"
              name="company_role"
              type="text"
              value={formData.company_role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Developer"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              minLength={6}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/users')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </form>
    </Card>
  );
}