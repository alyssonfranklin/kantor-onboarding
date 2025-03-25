import { UserCreateForm } from '@/components/admin/UserCreateForm';

export default function CreateUser() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New User</h1>
      <UserCreateForm />
    </div>
  );
}