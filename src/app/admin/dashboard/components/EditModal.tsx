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
}

const EditModal = ({ isOpen, onClose, onSave, item, entityType }: EditModalProps) => {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);
  
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
              <label className="block mb-1 font-medium">Department Lead</label>
              <input
                type="text"
                name="department_lead"
                value={formData.department_lead || ''}
                onChange={handleChange}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800"
                placeholder="User ID or name (optional)"
              />
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