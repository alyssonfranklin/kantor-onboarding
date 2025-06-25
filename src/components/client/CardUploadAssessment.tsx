import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

interface CardUploadAssessmentProps {
  title: string;
  description: string;
  onFilesChange: (files: File[]) => void;
}

const CardUploadAssessment: React.FC<CardUploadAssessmentProps> = ({
  title, description, onFilesChange,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    // Prevent duplicates by name and size
    const uniqueFiles = [
      ...files,
      ...newFiles.filter(
        (f) => !files.some((file) => file.name === f.name && file.size === f.size)
      ),
    ];
    setFiles(uniqueFiles);
    onFilesChange(uniqueFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowedExtensions = [".pdf", ".xls", ".xlsx", ".doc", ".docx"];
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const errors: string[] = [];
      const validFiles: File[] = [];

      filesArray.forEach((file) => {
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          errors.push(`"${file.name}" has an invalid file type.`);
        } else if (file.size > maxSize) {
          errors.push(`"${file.name}" exceeds the 25MB size limit.`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setError(errors.join(" "));
      } else {
        setError("");
      }

      if (validFiles.length > 0) {
        handleFiles(
          (() => {
            const dt = new DataTransfer();
            validFiles.forEach((f) => dt.items.add(f));
            return dt.files;
          })()
        );
      }

      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="w-full mx-auto border border-gray-300 rounded-lg shadow-md p-6 bg-white">
        <div>
          <h2 className="text-xl font-bold mb-2">{title || "Upload Assessments"}</h2>
          <p className="text-gray-600 mb-4 text-sm">
            {description ||
              "Please upload your employees and leaders. Our engine will update the status for every employee into the assessment repository."}
          </p>
        </div>
        <div
          className="border-2 border-dashed border-orange-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden text-black"
            onChange={handleInputChange}
          />
          <h3 className="font-semibold mb-2 text-center">
            Drop file or <span className="text-orange-700">Browse</span>
          </h3>
          <p className="text-gray-600 text-sm text-center font-semibold">
            Format: PDF, XLS and DOC ONLY | Max file size: 25 MB
          </p>
        </div>
        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((file, idx) => (
              <li
                key={file.name + file.size}
                className="flex items-center justify-start gap-4 bg-[#FDF6FE] rounded shadow px-3 py-2"
              >
                <button
                  className="ml-4 p-2 bg-white rounded-lg text-orange-700"
                  onClick={() => handleRemove(idx)}
                  aria-label={`Remove ${file.name}`}
                  type="button"
                >
                  <Image
                    src="/images/icons/trash-orange.svg"
                    alt="Trash Icon"
                    width={20} 
                    height={20}
                    className="rounded-full object-cover"
                  />
                </button>
                <span className="truncate max-w-xs font-semibold">
                  {file.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="my-4">
        <Button 
          type="button" 
          className="w-full font-bold bg-[#E62E05] text-white hover:bg-[#E62E05]/90"
          disabled={files.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CardUploadAssessment;