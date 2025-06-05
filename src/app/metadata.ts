import { generateMetadata } from "@/lib/metadata-utils";

// Metadata for the homepage
export default function metadata() {
  return generateMetadata({
    title: "Voxerion Admin Portal | Manage Your Business Productivity Suite",
    description: "Admin portal for Voxerion business productivity platform. Create and manage organizations, departments, employees, and AI assistants.",
    path: "", // Empty string for homepage
    keywords: ["admin", "portal", "dashboard", "management"],
  });
}