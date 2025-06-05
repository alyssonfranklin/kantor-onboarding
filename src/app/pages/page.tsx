import React from "react";
import LoginForm from "@/components/client/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="w-full min-h-screen flex items-center justify-center border border-blue-400">
            <LoginForm />
        </div>
    );
}