// src/app/create-assistant/page.tsx
import CreateAssistantWithFiles from '@/components/CreateAssistantWithFiles';

export default function CreateAssistantPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Create Assistant with Files</h1>
      <CreateAssistantWithFiles />
    </div>
  );
}