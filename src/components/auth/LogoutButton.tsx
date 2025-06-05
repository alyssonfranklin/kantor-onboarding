"use client";

import { useLogout } from "@/lib/auth/index-client";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  redirectTo?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

/**
 * Logout Button Component
 * 
 * A button that triggers the logout process when clicked.
 * Handles CSRF protection and cookie clearing automatically.
 */
export default function LogoutButton({
  redirectTo = "/login",
  className = "",
  variant = "outline"
}: LogoutButtonProps) {
  const { logout, logoutInProgress } = useLogout();
  
  const handleLogout = async () => {
    try {
      await logout();
      
      // Redirect after logout
      if (redirectTo && typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      disabled={logoutInProgress}
      className={className}
    >
      {logoutInProgress ? "Logging out..." : "Logout"}
    </Button>
  );
}