"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  // Simulate login to get a JWT token
  useEffect(() => {
    const simulateLogin = async () => {
      try {
        const response = await fetch('/api/verify-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@voxerion.com',
            password: 'admin123'
          }),
        });
        
        const data = await response.json();
        
        if (data.token) {
          setToken(data.token);
        }
      } catch (err) {
        console.error('Error getting token:', err);
      }
    };
    
    simulateLogin();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    if (!token) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        let url = '';
        
        switch (activeTab) {
          case 'users':
            // This would be a real API call to list users
            // In this demo, we're using placeholder data
            setData([
              { id: 'USER_0001', email: 'admin@voxerion.com', name: 'Admin User', role: 'admin', company_id: 'COMP_0001' },
              { id: 'USER_0002', email: 'user@example.com', name: 'Regular User', role: 'user', company_id: 'COMP_0001' },
            ]);
            break;
            
          case 'companies':
            // This would be a real API call to list companies
            setData([
              { company_id: 'COMP_0001', name: 'Voxerion Inc.', status: 'active', created_at: '2023-10-15' },
              { company_id: 'COMP_0002', name: 'Acme Corp', status: 'active', created_at: '2023-10-20' },
            ]);
            break;
            
          case 'departments':
            // This would be a real API call to list departments
            setData([
              { company_id: 'COMP_0001', department_name: 'Management', department_desc: 'Company leadership', user_head: 'USER_0001' },
              { company_id: 'COMP_0001', department_name: 'Engineering', department_desc: 'Software development', user_head: 'USER_0002' },
              { company_id: 'COMP_0002', department_name: 'Sales', department_desc: 'Sales team', user_head: null },
            ]);
            break;
            
          case 'employees':
            // This would be a real API call to list employees
            setData([
              { employee_id: 'EMP_0001', employee_name: 'John Doe', employee_role: 'Developer', company_id: 'COMP_0001' },
              { employee_id: 'EMP_0002', employee_name: 'Jane Smith', employee_role: 'Manager', company_id: 'COMP_0001' },
              { employee_id: 'EMP_0003', employee_name: 'Bob Johnson', employee_role: 'Designer', company_id: 'COMP_0002' },
            ]);
            break;
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', err);
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
        return ['ID', 'Email', 'Name', 'Role', 'Company ID', 'Actions'];
      case 'companies':
        return ['Company ID', 'Name', 'Status', 'Created At', 'Actions'];
      case 'departments':
        return ['Company ID', 'Department Name', 'Description', 'Department Head', 'Actions'];
      case 'employees':
        return ['Employee ID', 'Name', 'Role', 'Company ID', 'Actions'];
      default:
        return [];
    }
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
              <td className="p-3">
                <Button variant="destructive" size="sm" className="mr-2">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </td>
            </tr>
          );
          
        case 'companies':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">{item.company_id}</td>
              <td className="p-3">{item.name}</td>
              <td className="p-3">{item.status}</td>
              <td className="p-3">{item.created_at}</td>
              <td className="p-3">
                <Button variant="destructive" size="sm" className="mr-2">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
              </td>
            </tr>
          );
          
        case 'departments':
          return (
            <tr key={index} className="border-b border-gray-700">
              <td className="p-3">{item.company_id}</td>
              <td className="p-3">{item.department_name}</td>
              <td className="p-3">{item.department_desc}</td>
              <td className="p-3">{item.user_head || 'None'}</td>
              <td className="p-3">
                <Button variant="destructive" size="sm" className="mr-2">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
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
                <Button variant="destructive" size="sm" className="mr-2">Edit</Button>
                <Button variant="destructive" size="sm">Delete</Button>
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
      <div className="flex border-b border-gray-700 mb-6">
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
    </div>
  );
}