import { CompanyCreateForm } from '@/components/admin/CompanyCreateForm';

export default function CreateCompany() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Company</h1>
      <CompanyCreateForm />
    </div>
  );
}