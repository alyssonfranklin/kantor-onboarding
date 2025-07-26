"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logCompanyStatus, COMPANY_STATUS } from '@/lib/utils/usage-log-helper';

export default function CreateUserPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [departmentError, setDepartmentError] = useState('');
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

  // Fetch departments when company is selected
  const fetchDepartments = async (companyId: string) => {
    if (!companyId || !token) return;
    
    setIsLoadingDepartments(true);
    try {
      const response = await fetch(`/api/v1/departments?companyId=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDepartments(result.data || []);
        } else {
          setDepartments([]);
        }
      } else {
        setDepartments([]);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If company is selected, automatically set the assistant ID and fetch departments
    if (name === 'companyName') {
      const selectedCompany = companies.find(company => company.name === value);
      const assistantId = selectedCompany?.assistant_id || 'default_assistant_id';
      const companyId = selectedCompany?.company_id;
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: value, 
        assistantId,
        department: '' // Reset department when company changes
      }));
      
      // Fetch departments for the selected company
      if (companyId) {
        fetchDepartments(companyId);
      } else {
        setDepartments([]);
      }
    } else if (name === 'department' && value === 'NEW_DEPARTMENT') {
      // Open modal for creating new department
      setShowDepartmentModal(true);
      setNewDepartmentName('');
      setDepartmentError('');
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Create new department
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setDepartmentError('Department name is required');
      return;
    }

    const selectedCompany = companies.find(company => company.name === formData.companyName);
    if (!selectedCompany) {
      setDepartmentError('Please select a company first');
      return;
    }

    setIsCreatingDepartment(true);
    setDepartmentError('');

    try {
      const response = await fetch('/api/v1/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          company_id: selectedCompany.company_id,
          department_name: newDepartmentName.trim()
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh departments list
          await fetchDepartments(selectedCompany.company_id);
          // Set the newly created department as selected
          setFormData(prev => ({ ...prev, department: newDepartmentName.trim() }));
          // Close modal
          setShowDepartmentModal(false);
          setNewDepartmentName('');
        } else {
          setDepartmentError(result.message || 'Failed to create department');
        }
      } else {
        const errorData = await response.json();
        setDepartmentError(errorData.message || 'Failed to create department');
      }
    } catch (err) {
      console.error('Error creating department:', err);
      setDepartmentError('Error creating department');
    } finally {
      setIsCreatingDepartment(false);
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
      
      // Log company status after successful user creation
      const selectedCompany = companies.find(company => company.name === formData.companyName);
      if (data.companyId || selectedCompany?.company_id) {
        const companyId = data.companyId || selectedCompany?.company_id;
        try {
          await logCompanyStatus(companyId, COMPANY_STATUS.USER_CREATED, token);
          console.log('User creation status logged successfully');
        } catch (error) {
          console.error('Failed to log user creation status:', error);
          // Don't fail the main flow if logging fails
        }
      }
      
      setSuccess('User and company created successfully!');
      setFormData({
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
              
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                  required
                  disabled={isLoadingDepartments || !formData.companyName}
                >
                  <option value="">
                    {!formData.companyName 
                      ? 'Select a company first' 
                      : isLoadingDepartments 
                        ? 'Loading departments...' 
                        : 'Select a department'
                    }
                  </option>
                  {departments.map(department => (
                    <option key={department._id} value={department.department_name}>
                      {department.department_name}
                    </option>
                  ))}
                  {formData.companyName && (
                    <option value="NEW_DEPARTMENT" className="font-bold text-blue-400">
                      + New Department
                    </option>
                  )}
                </select>
              </div>
              
            </div>
            
            <Button 
              type="submit" 
              className="mt-6 w-full bg-red-500 hover:bg-red-600"
              disabled={isLoading || isLoadingCompanies || isLoadingDepartments}
            >
              {isLoading ? 'Creating...' : 'Create User and Company'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* New Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Department</h2>
            
            {departmentError && (
              <Alert className="mb-4 bg-red-800 border-red-600">
                <AlertDescription>{departmentError}</AlertDescription>
              </Alert>
            )}
            
            <div className="mb-4">
              <label className="block mb-2 font-medium text-white">Department Name</label>
              <input
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDepartmentName.trim() && !isCreatingDepartment) {
                    handleCreateDepartment();
                  } else if (e.key === 'Escape') {
                    setShowDepartmentModal(false);
                    setNewDepartmentName('');
                    setDepartmentError('');
                  }
                }}
                className="w-full p-2 rounded-md border border-gray-700 bg-gray-800 text-white"
                placeholder="Enter department name"
                disabled={isCreatingDepartment}
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDepartmentModal(false);
                  setNewDepartmentName('');
                  setDepartmentError('');
                }}
                disabled={isCreatingDepartment}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateDepartment}
                disabled={isCreatingDepartment || !newDepartmentName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingDepartment ? 'Creating...' : 'Create Department'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}