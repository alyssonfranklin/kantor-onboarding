"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  item: any;
  entityType: string;
  token?: string;
}

const EditModal = ({ isOpen, onClose, onSave, item, entityType, token }: EditModalProps) => {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  useEffect(() => {
    if (item) {
      // For departments, use department_lead_id for editing
      const formDataToSet = { ...item };
      if (entityType === 'departments' && item.department_lead_id) {
        formDataToSet.department_lead = item.department_lead_id;
      }
      setFormData(formDataToSet);
    }
  }, [item, entityType]);

  // Fetch users when editing departments
  useEffect(() => {
    if (isOpen && entityType === 'departments' && item?.company_id) {
      fetchUsers(item.company_id);
    }
  }, [isOpen, entityType, item]);

  const fetchUsers = async (companyId: string) => {
    setIsLoadingUsers(true);
    try {
      if (!token) return;
      const response = await fetch(`/api/v1/users?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUsers(result.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  const renderFormFields = () => {
    switch (entityType) {
      case 'users':
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <select
                name="role"
                value={formData.role || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              >
                <option value="user">User</option>
                <option value="orgadmin">Organization Admin</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </>
        );
        
      case 'companies':
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Company Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        );
        
      case 'departments':
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Department Name</label>
              <input
                type="text"
                name="department_name"
                value={formData.department_name || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <textarea
                name="department_description"
                value={formData.department_description || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 h-24 text-white"
                placeholder="Enter department description..."
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Department Lead</label>
              <select
                name="department_lead"
                value={formData.department_lead || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                disabled={isLoadingUsers}
              >
                <option value="">No department lead</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {isLoadingUsers && (
                <p className="text-sm text-gray-400 mt-1">Loading users...</p>
              )}
            </div>
          </>
        );
        
      case 'employees':
        return (
          <>
            <div>
              <label className="block mb-1 font-medium">Employee Name</label>
              <input
                type="text"
                name="employee_name"
                value={formData.employee_name || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Role</label>
              <input
                type="text"
                name="employee_role"
                value={formData.employee_role || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
              />
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold">
            Edit {entityType.charAt(0).toUpperCase() + entityType.slice(0, -1)}
          </h3>
        </div>
        
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}
            
            {error && (
              <Alert className="mb-4 bg-red-800 border-red-600">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-gray-600"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditModal;