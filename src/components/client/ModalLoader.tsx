import { Loader2 } from 'lucide-react';
import React from 'react';

interface ModalLoaderProps {
  message: string;
};

const ModalLoader: React.FC<ModalLoaderProps> = ({ message }) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-white rounded-lg p-6 flex items-center gap-2 shadow-lg">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {message}...
        </div>
      </div>
    </>
  );
};

export default ModalLoader;