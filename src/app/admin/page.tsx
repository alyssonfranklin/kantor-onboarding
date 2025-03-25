import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Voxerion Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-muted-foreground mb-4">Create, edit and manage users in the system</p>
          <div className="space-y-2">
            <Link href="/admin/users/create" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Create User
            </Link>
            <Link href="/admin/users" className="block w-full bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
              Manage Users
            </Link>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Company Management</h2>
          <p className="text-muted-foreground mb-4">Create and manage companies</p>
          <div className="space-y-2">
            <Link href="/admin/companies/create" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Create Company
            </Link>
            <Link href="/admin/companies" className="block w-full bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
              Manage Companies
            </Link>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Department Management</h2>
          <p className="text-muted-foreground mb-4">Create and manage departments</p>
          <div className="space-y-2">
            <Link href="/admin/departments/create" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Create Department
            </Link>
            <Link href="/admin/departments" className="block w-full bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
              Manage Departments
            </Link>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Employee Management</h2>
          <p className="text-muted-foreground mb-4">Create and manage employee records</p>
          <div className="space-y-2">
            <Link href="/admin/employees/create" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Create Employee
            </Link>
            <Link href="/admin/employees" className="block w-full bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
              Manage Employees
            </Link>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Assessment Management</h2>
          <p className="text-muted-foreground mb-4">Upload and manage assessments</p>
          <div className="space-y-2">
            <Link href="/upload-assessment" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Upload Assessment
            </Link>
            <Link href="/admin/assessments" className="block w-full bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
              Manage Assessments
            </Link>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Organization Admin</h2>
          <p className="text-muted-foreground mb-4">Create organization admin accounts</p>
          <div className="space-y-2">
            <Link href="/agent-org-creation" className="block w-full bg-blue-600 text-white py-2 px-4 rounded text-center hover:bg-blue-700">
              Create Org Admin
            </Link>
          </div>
        </Card>
      </div>
      
      <div className="mt-12">
        <Card className="p-6 bg-gray-50 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Database Administration</h2>
          <p className="text-muted-foreground mb-4">Manage database operations</p>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/initialize-db" className="block bg-amber-600 text-white py-2 px-4 rounded text-center hover:bg-amber-700">
              Initialize Database
            </Link>
            <Link href="/admin/backup-db" className="block bg-emerald-600 text-white py-2 px-4 rounded text-center hover:bg-emerald-700">
              Backup Database
            </Link>
          </div>
        </Card>
      </div>
      
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/create-assistant" className="bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
            Create Assistant
          </Link>
          <Link href="/onboarding-company" className="bg-gray-100 py-2 px-4 rounded text-center hover:bg-gray-200">
            Company Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}