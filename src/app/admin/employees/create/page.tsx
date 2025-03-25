import { EmployeeCreateForm } from '@/components/admin/EmployeeCreateForm';

export default function CreateEmployee() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Employee</h1>
      <EmployeeCreateForm />
    </div>
  );
}