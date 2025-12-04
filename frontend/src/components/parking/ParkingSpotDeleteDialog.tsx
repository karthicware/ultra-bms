'use client';

/**
 * Parking Spot Delete Dialog Component
 * Story 3.8: Parking Spot Inventory Management
 * AC#8: Delete with confirmation (only AVAILABLE/UNDER_MAINTENANCE)
 */

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
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { ParkingSpot } from '@/types/parking';
import { useDeleteParkingSpot } from '@/hooks/useParkingSpots';
import { canDeleteParkingSpot } from '@/types/parking';

interface ParkingSpotDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSpot: ParkingSpot;
  onSuccess: () => void;
}

export function ParkingSpotDeleteDialog({
  open,
  onOpenChange,
  parkingSpot,
  onSuccess,
}: ParkingSpotDeleteDialogProps) {
  const { mutate: deleteSpot, isPending } = useDeleteParkingSpot();

  const canDelete = canDeleteParkingSpot(parkingSpot);

  const handleDelete = () => {
    if (!canDelete) return;

    deleteSpot(parkingSpot.id, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-delete-parking-spot">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Parking Spot
          </AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Are you sure you want to delete parking spot{' '}
                <strong>{parkingSpot.spotNumber}</strong>? This action cannot be undone.
              </>
            ) : (
              <>
                <span className="text-destructive">
                  Cannot delete parking spot <strong>{parkingSpot.spotNumber}</strong> because
                  it is currently assigned to a tenant.
                </span>
                <br />
                <br />
                Please unassign the tenant first before deleting this parking spot.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canDelete || isPending}
            className="bg-red-600 text-white hover:bg-red-700"
            data-testid="btn-confirm-delete"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
