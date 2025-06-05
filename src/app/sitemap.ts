import { getBaseUrl } from "@/lib/environment";
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  
  // Static routes
  const routes = [
    "",
    "/about",
    "/contact",
    "/onboarding-company",
    "/upload-assessment",
    "/create-assistant",
    "/agent-org-creation",
  ];
  
  // Generate static routes
  const staticRoutes = routes.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  })) as MetadataRoute.Sitemap;
  
  // In a real application, you would add dynamic routes here
  // For example, fetch data from your API/database and generate
  // routes for each blog post, product, etc.
  // const dynamicRoutes = [...];
  
  return [...staticRoutes];
}