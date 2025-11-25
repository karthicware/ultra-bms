/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit Delete Dialog Component
 * AlertDialog for confirming unit deletion with validation
 * AC: #11 - Soft delete with occupied status validation
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
import { deleteUnit } from '@/services/units.service';
import { AlertTriangle } from 'lucide-react';

interface UnitDeleteDialogProps {
  unitId: string;
  unitNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UnitDeleteDialog({
  unitId,
  unitNumber,
  open,
  onOpenChange,
  onSuccess,
}: UnitDeleteDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmedDelete = async () => {
    try {
      setIsDeleting(true);

      await deleteUnit(unitId);

      toast({
        title: 'Success',
        description: `Unit ${unitNumber} has been archived successfully`,
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;

      // Check if error is due to occupied status
      if (errorMessage?.toLowerCase().includes('occupied')) {
        toast({
          title: 'Cannot Delete Unit',
          description: 'Cannot delete occupied unit',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage || 'Failed to delete unit',
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
            Archive Unit
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <strong>Unit {unitNumber}</strong>?
            <br />
            <br />
            This action cannot be undone. The unit will be archived and removed from
            active listings.
            <br />
            <br />
            <strong>Note:</strong> Occupied units cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmedDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Archiving...' : 'Archive Unit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
