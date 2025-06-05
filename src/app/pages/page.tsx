import React from "react";
import LoginForm from "@/components/client/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="w-full min-h-screen flex justify-center pt-8 md:pt-20">
            <LoginForm />
        </div>
    );
}