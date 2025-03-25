export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard 
          title="Data Dashboard" 
          description="View and manage all data"
          link="/admin/dashboard"
          highlight={true}
        />
        <DashboardCard 
          title="Users" 
          description="Create and manage users"
          link="/admin/users/create"
        />
        <DashboardCard 
          title="Companies" 
          description="Create and manage companies"
          link="/admin/companies/create"
        />
        <DashboardCard 
          title="Departments" 
          description="Create and manage departments"
          link="/admin/departments/create"
        />
        <DashboardCard 
          title="Employees" 
          description="Create and manage employees"
          link="/admin/employees/create"
        />
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
        <p className="mb-4">
          The Kantor API provides endpoints for managing users, companies, departments, and employees.
          All endpoints require JWT authentication except for the login endpoint.
        </p>
        <div className="bg-gray-800 p-4 rounded-md">
          <pre className="text-sm overflow-x-auto">
            <code>
              # Authentication
              POST /api/verify-password - User login
              POST /api/logout - User logout
              
              # User Management
              POST /api/add-user - Create a new user and company
              
              # Department Management
              POST /api/departments - Create a new department
              GET /api/departments/company/[companyId] - Get departments by company
              
              # Employee Management
              POST /api/employees - Create a new employee
              GET /api/employees/company/[companyId] - Get employees by company
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ 
  title, 
  description, 
  link, 
  highlight = false 
}: { 
  title: string; 
  description: string; 
  link: string;
  highlight?: boolean;
}) {
  return (
    <a 
      href={link}
      className={`block rounded-lg p-6 hover:bg-gray-700 transition-colors ${
        highlight 
          ? 'bg-red-900 border border-red-700' 
          : 'bg-gray-800'
      }`}
    >
      <h3 className="text-xl font-bold mb-2 text-red-400">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </a>
  );
}