/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Property Delete Dialog Component
 * AlertDialog for confirming property deletion with validation
 * AC: #11 - Soft delete with occupied unit validation
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteProperty } from '@/services/properties.service';
import { AlertTriangle } from 'lucide-react';

interface PropertyDeleteDialogProps {
  propertyId: string;
  propertyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PropertyDeleteDialog({
  propertyId,
  propertyName,
  open,
  onOpenChange,
  onSuccess,
}: PropertyDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmedDelete = async () => {
    try {
      setIsDeleting(true);

      await deleteProperty(propertyId);

      toast({
        title: 'Success',
        description: `Property "${propertyName}" has been archived successfully`,
        variant: 'success',
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;

      // Check if error is due to occupied units
      if (errorMessage?.toLowerCase().includes('occupied')) {
        toast({
          title: 'Cannot Delete Property',
          description: 'Cannot delete property with occupied units',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to delete property',
          variant: 'destructive',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-delete-confirm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Archive Property
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>"{propertyName}"</strong>?
            <br />
            <br />
            This action cannot be undone. The property will be archived and removed from
            active listings.
            <br />
            <br />
            <strong>Note:</strong> Properties with occupied units cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmedDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? 'Archiving...' : 'Archive Property'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
