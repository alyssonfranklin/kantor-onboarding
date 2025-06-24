import Image from 'next/image'
import React, { useRef, useState } from 'react'
import { Button } from '../ui/button';
import EmployeesConfirmation from './users/EmployeesConfirmation';

export default function BatchProcessing(
  { onUploadSuccess }
) {

  const [error, setError] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleNextClick = () => {
    console.log('continue');
    setShowFileUpload(true);
  };

  const handleUploadClick = () => {
    onUploadSuccess();
  };

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
    // onFilesChange(uniqueFiles);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    // onFilesChange(updatedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowedExtensions = [".csv"];
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
    <div className="bg-white border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap justify-center mx-auto px-4">
        <div className="w-full mt-14">
          <div className="flex justify-center">
            <Image
              src="/images/icons/key.svg"
              alt="key icon"
              width={28}
              height={28}
              className="inline-block"
            />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Batch Processing
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              If you are uploading large amounts of data, you may save time by using our importer tools.  
            </div>
          </div>

          {error && (
            <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {
            !showFileUpload &&
            <div>
              <div className='mt-4 px-12 w-full flex gap-4 text-gray-600'>
                <div className='w-4/12 pr-4'>
                  <p>
                    The spreadsheet is very straightforward.
                  </p>
                  <p className='mt-4'>
                    Just add one line per user with <b>Name, Email, Role</b> and its <b>Leader email</b>.
                  </p>
                  <div className='flex gap-4 items-center mt-14'>
                    <div className='bg-orange-300 text-black flex items-center p-4 rounded-lg'>
                      <Image
                        src="/images/icons/download.svg"
                        alt="Download icon"
                        width={28}
                        height={28}
                        className="inline-block"
                      />
                    </div>
                    <div>
                      <b>
                        Download Employee Template
                      </b>
                    </div>
                  </div>
                </div>
                <div className='w-8/12'>
                  <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/P4FYfHfo-1o?controls=1"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>

              <div className="py-4">
                <Button
                  type="submit"
                  className="w-full"
                  onClick={handleNextClick}
                >
                  Continue
                </Button>
              </div>
            </div>
          }

          {
            showFileUpload &&
            <div className='mt-8 border border-gray-300 rounded-lg p-4'>
              <div>
                <h3 className='font-semibold'>
                  Upload Employee List
                </h3>
                <p className='text-gray-600'>
                  Please upload the file using the CSV format. The filesize has to be is under 25 MB.
                </p>
              </div>

              {
                files.length === 0 &&
                <div
                  className="border border-dashed border-orange-700 rounded-lg p-4 mt-4 flex flex-col items-center justify-center cursor-pointer bg-orange-50 hover:bg-gray-100 transition"
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <h3 className="font-semibold mb-2 text-center">
                    Drop file or <span className="text-orange-700">Browse</span>
                  </h3>
                  <p className="text-gray-600 text-sm text-center font-semibold">
                    Format: CSV ONLY | Max file size: 25 MB
                  </p>
                </div>
              }
              
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

              <div className="py-4">
                <Button
                  type="submit"
                  className="w-full"
                  onClick={handleUploadClick}
                  disabled={files.length === 0}
                >
                  Continue
                </Button>
              </div>

            </div>
          }

        </div>
      </div>
    </div>
  )
}
