'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

export function CompanyCreateForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    assistant_id: '',
    status: 'active',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Company created successfully!');
        // Reset form
        setFormData({
          name: '',
          assistant_id: '',
          status: 'active',
        });
        
        // Redirect to company list after 2 seconds
        setTimeout(() => {
          router.push('/admin/companies');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create company');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error creating company:', error);
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
            <label htmlFor="name" className="block text-sm font-medium">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Acme Corporation"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="assistant_id" className="block text-sm font-medium">
              Assistant ID <span className="text-red-500">*</span>
            </label>
            <input
              id="assistant_id"
              name="assistant_id"
              type="text"
              required
              value={formData.assistant_id}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="asst_123456789"
            />
            <p className="text-sm text-gray-500">Enter the OpenAI Assistant ID</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/companies')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Company'}
          </Button>
        </div>
      </form>
    </Card>
  );
}