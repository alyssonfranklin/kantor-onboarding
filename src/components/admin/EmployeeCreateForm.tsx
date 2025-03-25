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

export function EmployeeCreateForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_role: '',
    employee_leader: '',
    company_id: '',
  });
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
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
  
  // Fetch potential leaders for the selected company
  useEffect(() => {
    const fetchLeaders = async () => {
      if (!formData.company_id) {
        setLeaders([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/users/company/${formData.company_id}`);
        const data = await response.json();
        if (response.ok) {
          setLeaders(data);
        } else {
          console.error('Failed to fetch leaders:', data.error);
          setLeaders([]);
        }
      } catch (error) {
        console.error('Error fetching leaders:', error);
        setLeaders([]);
      }
    };
    
    fetchLeaders();
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
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Employee created successfully!');
        // Reset form
        setFormData({
          employee_name: '',
          employee_role: '',
          employee_leader: '',
          company_id: '',
        });
        
        // Redirect to employee list after 2 seconds
        setTimeout(() => {
          router.push('/admin/employees');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create employee');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating employee:', error);
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
            <label htmlFor="employee_name" className="block text-sm font-medium">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <input
              id="employee_name"
              name="employee_name"
              type="text"
              required
              value={formData.employee_name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="employee_role" className="block text-sm font-medium">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              id="employee_role"
              name="employee_role"
              type="text"
              required
              value={formData.employee_role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Software Engineer"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="employee_leader" className="block text-sm font-medium">
              Manager <span className="text-red-500">*</span>
            </label>
            <select
              id="employee_leader"
              name="employee_leader"
              required
              value={formData.employee_leader}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              disabled={!formData.company_id}
            >
              <option value="">Select a manager</option>
              {leaders.map(leader => (
                <option key={leader.id} value={leader.id}>
                  {leader.name} ({leader.email})
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
            onClick={() => router.push('/admin/employees')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Card>
  );
}