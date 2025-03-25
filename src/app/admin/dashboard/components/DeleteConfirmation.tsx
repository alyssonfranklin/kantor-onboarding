"use client";

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: string;
  itemName: string;
}

const DeleteConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  entityType,
  itemName
}: DeleteConfirmationProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError('');
    
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-red-500">Confirm Deletion</h3>
        </div>
        
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to delete this {entityType.slice(0, -1)}?
            <span className="block mt-2 font-medium">{itemName}</span>
          </p>
          
          <p className="mb-4 text-yellow-500">
            This action cannot be undone.
          </p>
          
          {error && (
            <Alert className="mb-4 bg-red-800 border-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;