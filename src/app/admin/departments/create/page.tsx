import { DepartmentCreateForm } from '@/components/admin/DepartmentCreateForm';

export default function CreateDepartment() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Department</h1>
      <DepartmentCreateForm />
    </div>
  );
}