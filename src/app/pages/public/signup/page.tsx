import RegisterForm from "@/components/client/auth/RegisterForm";
import React from "react";

export default function SignUpPage() {
    return (
        <div className="w-full min-h-screen flex justify-center pt-8 md:pt-20">
            <RegisterForm />
        </div>
    );
}