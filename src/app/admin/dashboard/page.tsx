"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, KeyRound } from 'lucide-react';
import EditModal from './components/EditModal';
import DeleteConfirmation from './components/DeleteConfirmation';
import UpdatePasswordModal from './components/UpdatePasswordModal';
import { updateEntity, deleteEntity } from './utils/api';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  
  // Edit and delete modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Initialize database and login to get a JWT token
  useEffect(() => {
    const initializeAndLogin = async () => {
      try {
        // First try to initialize the database if it's not already initialized
        console.log('Attempting to initialize database...');
        const initResponse = await fetch('/api/v1/admin/initialize-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const initData = await initResponse.json();
        console.log('Database initialization response:', initData);
        
        // Now try to login with admin credentials
        console.log('Attempting to login...');
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
        console.log('Login response:', loginData);
        
        if (loginData.token) {
          setToken(loginData.token);
          console.log('Successfully logged in and got token');
        } else {
          setError('Login failed: ' + (loginData.error || 'Unknown error'));
          console.error('Login failed:', loginData);
        }
      } catch (err) {
        console.error('Error during initialization or login:', err);
        setError('Failed to initialize or login: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    
    initializeAndLogin();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (!token) {
      console.log('No token available - skipping data fetch');
      return;
    }
    
    console.log(`Dashboard - Fetching ${activeTab} data with token:`, token.substring(0, 15) + '...');
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        let url = '';
        let response;
        let result;
        
        switch (activeTab) {
          case 'users':
            url = '/api/v1/users/with-tags';
            console.log(`Dashboard - Fetching users with tags from ${url}`);
            
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`Dashboard - Users with tags API response status:`, response.status);
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const text = await response.text();
              console.error('Dashboard - Non-JSON response received:', text.substring(0, 200));
              throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            result = await response.json();
            console.log('Dashboard - Users with tags API response body:', result);
            
            if (response.ok && result.success) {
              console.log(`Dashboard - Got ${result.data?.length || 0} users with tags`);
              setData(result.data || []);
            } else {
              throw new Error(result.message || result.error || 'Failed to fetch users with tags');
            }
            break;
            
          case 'companies':
            url = '/api/v1/companies';
            console.log(`Dashboard - Fetching companies from ${url}`);
            
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`Dashboard - Companies API response status:`, response.status);
            result = await response.json();
            console.log('Dashboard - Companies API response body:', result);
            
            if (response.ok && result.success) {
              console.log(`Dashboard - Got ${result.data?.length || 0} companies`);
              setData(result.data || []);
            } else {
              throw new Error(result.message || result.error || 'Failed to fetch companies');
            }
            break;
            
          case 'departments':
            url = '/api/v1/departments';
            console.log(`Dashboard - Fetching departments from ${url}`);
            
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`Dashboard - Departments API response status:`, response.status);
            result = await response.json();
            console.log('Dashboard - Departments API response body:', result);
            
            if (response.ok && result.success) {
              console.log(`Dashboard - Got ${result.data?.length || 0} departments`);
              setData(result.data || []);
            } else {
              throw new Error(result.message || result.error || 'Failed to fetch departments');
            }
            break;
            
          case 'employees':
            url = '/api/v1/employees';
            console.log(`Dashboard - Fetching employees from ${url}`);
            
            response = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log(`Dashboard - Employees API response status:`, response.status);
            result = await response.json();
            console.log('Dashboard - Employees API response body:', result);
            
            if (response.ok && result.success) {
              console.log(`Dashboard - Got ${result.data?.length || 0} employees`);
              setData(result.data || []);
            } else {
              throw new Error(result.message || result.error || 'Failed to fetch employees');
            }
            break;
            
          case 'tokens':
            // For tokens, we don't have a direct API yet
            // Future implementation would fetch from a tokens endpoint
            console.log('Dashboard - Using mock data for tokens');
            setData([
              { 
                token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
                user_id: token ? 'Current token' : 'Unknown', 
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
              }
            ]);
            break;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        console.error(`Dashboard - Error fetching ${activeTab}:`, err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab, token]);

  // Render table columns based on active tab
  const getTableColumns = () => {
    switch (activeTab) {
      case 'users':
        return ['ID', 'Email', 'Name', 'Role', 'Company ID', 'Tags', 'Actions'];
      case 'companies':
        return ['Company ID', 'Name', 'Assistant ID', 'Status', 'Created At', 'Actions'];
      case 'departments':
        return ['Department ID', 'Company', 'Department Name', 'Description', 'Department Lead', 'Created At', 'Actions'];
      case 'employees':
        return ['Employee ID', 'Name', 'Role', 'Company ID', 'Actions'];
      case 'tokens':
        return ['Token (truncated)', 'User ID', 'Expires At', 'Actions'];
      default:
        return [];
    }
  };

  // Handle edit button click
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  // Handle update password button click
  const handleUpdatePassword = (item: any) => {
    setSelectedItem(item);
    setPasswordModalOpen(true);
  };
  
  // Handle save after edit
  const handleSaveEdit = async (updatedData: any) => {
    try {
      // Determine the ID field based on the entity type
      let id = '';
      switch (activeTab) {
        case 'users':
          id = updatedData.id;
          break;
        case 'companies':
          id = updatedData.company_id;
          break;
        case 'departments':
          id = updatedData.department_id;
          break;
        case 'employees':
          id = updatedData.employee_id;
          break;
        case 'tokens':
          id = updatedData.token;
          break;
      }
      
      // Call the API to update the entity
      await updateEntity(activeTab, id, updatedData, token);
      
      // Update the local data
      setData(prevData => 
        prevData.map(item => {
          if ((activeTab === 'users' && item.id === id) ||
              (activeTab === 'companies' && item.company_id === id) ||
              (activeTab === 'departments' && item.department_id === id) ||
              (activeTab === 'employees' && item.employee_id === id) ||
              (activeTab === 'tokens' && item.token === id)) {
            return { ...item, ...updatedData };
          }
          return item;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err; // Re-throw to be caught by the modal
    }
  };
  
  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      // Determine the ID field based on the entity type
      let id = '';
      switch (activeTab) {
        case 'users':
          id = selectedItem.id;
          break;
        case 'companies':
          id = selectedItem.company_id;
          break;
        case 'departments':
          id = selectedItem.department_id;
          break;
        case 'employees':
          id = selectedItem.employee_id;
          break;
        case 'tokens':
          id = selectedItem.token;
          break;
      }
      
      // Call the API to delete the entity
      await deleteEntity(activeTab, id, token);
      
      // Update the local data
      setData(prevData => 
        prevData.filter(item => {
          if ((activeTab === 'users' && item.id === id) ||
              (activeTab === 'companies' && item.company_id === id) ||
              (activeTab === 'departments' && item.department_id === id) ||
              (activeTab === 'employees' && item.employee_id === id) ||
              (activeTab === 'tokens' && item.token === id)) {
            return false;
          }
          return true;
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err; // Re-throw to be caught by the modal
    }
  };

  // Handle password update
  const handleUpdatePasswordSubmit = async (newPassword: string) => {
    if (!selectedItem) return;
    
    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`/api/v1/users/${selectedItem.id}/update-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update password');
      }

      // Success - password updated
      setPasswordModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update password');
      }
      throw err; // Re-throw to be caught by the modal
    }
  };

  // Render tags component
  const renderTags = (tags: any[]) => {
    // Handle undefined, null, or non-array tags
    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return <span className="text-gray-500 text-sm italic">No tags</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200"
            title={tag?.tag_name || 'Unknown tag'}
          >
            {tag?.tag_name ? (tag.tag_name.length > 12 ? tag.tag_name.substring(0, 12) + '...' : tag.tag_name) : 'Unknown'}
          </span>
        ))}
        {tags.length > 3 && (
          <span 
            className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200"
            title={`${tags.length - 3} more tags: ${tags.slice(3).map(t => t?.tag_name || 'Unknown').join(', ')}`}
          >
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  };

  // Render table rows based on active tab
  const renderTableRows = () => {
    return data.map((item, index) => {
      switch (activeTab) {
        case 'users':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">{item.id}</td>
              <td className="p-3">{item.email}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.role}</td>
              <td className="p-3">{item.company_id}</td>
              <td className="p-3">{renderTags(item.tags || [])}</td>
              <td className="p-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => handleEdit(item)}
                  title="Edit user"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => handleUpdatePassword(item)}
                  title="Update password"
                >
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item)}
                  title="Delete user"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          );
          
        case 'companies':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">{item.company_id}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">
                <div className="flex items-center">
                  <span className="font-mono text-xs mr-2">{item.assistant_id || 'N/A'}</span>
                  {item.assistant_id && (
                    <button 
                      className="text-gray-400 hover:text-white text-xs"
                      onClick={() => navigator.clipboard.writeText(item.assistant_id)}
                      title="Copy assistant ID"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </td>
              <td className="p-3">{item.status}</td>
              <td className="p-3">{item.created_at}</td>
              <td className="p-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => handleEdit(item)}
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          );
          
        case 'departments':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">
                <span className="font-mono text-xs">{item.department_id}</span>
              </td>
              <td className="p-3">{item.company_name || item.company_id}</td>
              <td className="p-3">{item.department_name}</td>
              <td className="p-3">
                <div className="max-w-xs">
                  <span className="text-sm" title={item.department_description || 'No description'}>
                    {item.department_description 
                      ? (item.department_description.length > 50 
                          ? item.department_description.substring(0, 50) + '...' 
                          : item.department_description)
                      : 'No description'
                    }
                  </span>
                </div>
              </td>
              <td className="p-3">{item.department_lead_name || 'None'}</td>
              <td className="p-3">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</td>
              <td className="p-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => handleEdit(item)}
                  title="Edit department"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item)}
                  title="Delete department"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          );
          
        case 'employees':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">{item.employee_id}</td>
              <td className="p-3">{item.employee_name}</td>
              <td className="p-3">{item.employee_role || 'N/A'}</td>
              <td className="p-3">{item.company_id}</td>
              <td className="p-3">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mr-2"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          );
          
        case 'tokens':
          // Truncate the token for display
          const truncatedToken = item.token.substring(0, 20) + '...';
          
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">
                <div className="flex items-center">
                  <span className="font-mono text-xs">{truncatedToken}</span>
                  <button 
                    className="ml-2 text-gray-400 hover:text-white text-xs"
                    onClick={() => navigator.clipboard.writeText(item.token)}
                    title="Copy full token"
                  >
                    Copy
                  </button>
                </div>
              </td>
              <td className="p-3">{item.user_id}</td>
              <td className="p-3">{new Date(item.expires_at).toLocaleString()}</td>
              <td className="p-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(item)}
                  title="Revoke token"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          );
          
        default:
          return null;
      }
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Data Dashboard</h1>
      
      {/* Tab navigation */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'companies' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('companies')}
        >
          Companies
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'departments' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'employees' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('employees')}
        >
          Employees
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'tokens' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-200'}`}
          onClick={() => setActiveTab('tokens')}
        >
          Access Tokens
        </button>
      </div>
      
      {/* Card with table */}
      <Card className="w-full bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
          <Button
            variant="destructive"
            onClick={() => window.location.href = `/admin/${activeTab}/create`}
          >
            Create New
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-800 border-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {isLoading ? (
            <div className="py-8 text-center">Loading data...</div>
          ) : data.length === 0 ? (
            <div className="py-8 text-center">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    {getTableColumns().map((column, index) => (
                      <th key={index} className="p-3 font-medium">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Modal */}
      {selectedItem && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveEdit}
          item={selectedItem}
          entityType={activeTab}
          token={token}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {selectedItem && (
        <DeleteConfirmation
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          entityType={activeTab}
          itemName={
            activeTab === 'users' 
              ? selectedItem.name || selectedItem.email
              : activeTab === 'companies'
                ? selectedItem.name
                : activeTab === 'departments'
                  ? selectedItem.department_name
                  : activeTab === 'employees'
                    ? selectedItem.employee_name
                    : 'this item'
          }
        />
      )}
      
      {/* Update Password Modal */}
      {selectedItem && activeTab === 'users' && (
        <UpdatePasswordModal
          isOpen={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          onUpdatePassword={handleUpdatePasswordSubmit}
          user={{
            id: selectedItem.id,
            name: selectedItem.name,
            email: selectedItem.email
          }}
        />
      )}
    </div>
  );
}