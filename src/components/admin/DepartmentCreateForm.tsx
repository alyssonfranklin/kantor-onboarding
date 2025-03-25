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

type User = {
  id: string;
  name: string;
  email: string;
  company_id: string;
};

export function DepartmentCreateForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_id: '',
    department_name: '',
    department_desc: '',
    user_head: '',
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  
  // Fetch users for the selected company
  useEffect(() => {
    const fetchUsers = async () => {
      if (!formData.company_id) {
        setUsers([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/users/company/${formData.company_id}`);
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        } else {
          console.error('Failed to fetch users:', data.error);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      }
    };
    
    fetchUsers();
  }, [formData.company_id]);
  
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
    
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Department created successfully!');
        // Reset form
        setFormData({
          company_id: '',
          department_name: '',
          department_desc: '',
          user_head: '',
        });
        
        // Redirect to department list after 2 seconds
        setTimeout(() => {
          router.push('/admin/departments');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create department');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating department:', error);
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
        <div className="space-y-4">
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
            <label htmlFor="department_name" className="block text-sm font-medium">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="department_name"
              name="department_name"
              type="text"
              required
              value={formData.department_name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Engineering"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="department_desc" className="block text-sm font-medium">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="department_desc"
              name="department_desc"
              required
              value={formData.department_desc}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Department description..."
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="user_head" className="block text-sm font-medium">
              Department Head <span className="text-red-500">*</span>
            </label>
            <select
              id="user_head"
              name="user_head"
              required
              value={formData.user_head}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              disabled={!formData.company_id}
            >
              <option value="">Select a department head</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {!formData.company_id && (
              <p className="text-sm text-amber-600">Please select a company first</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/departments')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Card>
  );
}