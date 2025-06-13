import { ProtectedRoute } from "@/components/auth";
import React from "react";

export default function SetupLayout(
  { children }: {
      children: React.ReactNode;
  }
) {
  return (
      <ProtectedRoute>
        <div className="flex gap-2 min-h-screen">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </ProtectedRoute>
  );
}
