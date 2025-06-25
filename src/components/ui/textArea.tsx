import React from "react";

interface TextAreaProps {
    placeholder?: string;
    value?: string;
    onChange: (value: string) => void;
    className?: string;
    rows?: number;
    disabled?: boolean;
    required?: boolean;
    name: string;
}

const TextArea: React.FC<TextAreaProps> = ({
    placeholder = "Enter text...",
    value = "",
    onChange,
    className = "",
    rows = 4,
    disabled = false,
    required = false,
    name = ""
}) => {
    return (
        <textarea
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF9C66] transition ${className}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e)}
            rows={rows}
            disabled={disabled}
            required={required}
            name={name}
        />
    );
};

export default TextArea;