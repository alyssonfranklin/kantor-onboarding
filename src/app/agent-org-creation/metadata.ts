import { generateMetadata } from "@/lib/metadata-utils";

// Metadata for the agent-org-creation page
export default function metadata() {
  return generateMetadata({
    title: "Create Organization & AI Agent | Voxerion",
    description: "Create a new organization with an AI assistant and admin user in the Voxerion platform.",
    path: "agent-org-creation",
    keywords: ["organization", "creation", "AI agent", "setup", "onboarding"],
  });
}