import PasswordProtection from '@/components/PasswordProtection';

export const metadata = {
  title: 'Kantor Admin',
  description: 'Kantor Admin Dashboard',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PasswordProtection>
      <div className="flex min-h-screen flex-col bg-gray-900 text-white">
        <header className="border-b border-gray-700 bg-gray-800 p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Kantor Admin</h1>
            <nav>
              <ul className="flex space-x-4">
                <li><a href="/admin/users/create" className="hover:text-red-400">Users</a></li>
                <li><a href="/admin/companies/create" className="hover:text-red-400">Companies</a></li>
                <li><a href="/admin/departments/create" className="hover:text-red-400">Departments</a></li>
                <li><a href="/admin/employees/create" className="hover:text-red-400">Employees</a></li>
                <li><a href="/" className="hover:text-red-400">Home</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto flex-grow p-4">
          {children}
        </main>
        <footer className="border-t border-gray-700 bg-gray-800 p-4">
          <div className="container mx-auto text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Kantor Admin
          </div>
        </footer>
      </div>
    </PasswordProtection>
  );
}