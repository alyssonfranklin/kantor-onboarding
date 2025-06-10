import { ProtectedRoute } from "@/components/auth";
import SideMenu from "@/components/client/SideMenu";
import React from "react";

export default function DashboardLayout(
    { children }: {
        children: React.ReactNode;
    }
) {
    return (
        <ProtectedRoute>
            <div className="flex gap-2 min-h-screen">
                <SideMenu />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
        
    );
}
