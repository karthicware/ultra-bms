'use client';

/**
 * Bulk Actions Bar Component
 * Story 3.8: Parking Spot Inventory Management
 * AC#10: Bulk selection and actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { X, Trash2, RefreshCw, ChevronDown, Loader2 } from 'lucide-react';
import { ParkingSpotStatus } from '@/types/parking';
import type { ParkingSpot } from '@/types/parking';
import {
  useBulkDeleteParkingSpots,
  useBulkChangeParkingSpotStatus,
} from '@/hooks/useParkingSpots';
import { PARKING_SPOT_STATUS_CONFIG, canDeleteParkingSpot } from '@/types/parking';

interface BulkActionsBarProps {
  selectedIds: string[];
  selectedSpots: ParkingSpot[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

type BulkAction = 'delete' | 'status-available' | 'status-maintenance';

export function BulkActionsBar({
  selectedIds,
  selectedSpots,
  onActionComplete,
  onClearSelection,
}: BulkActionsBarProps) {
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const { mutate: bulkDelete, isPending: isDeleting } = useBulkDeleteParkingSpots();
  const { mutate: bulkChangeStatus, isPending: isChangingStatus } =
    useBulkChangeParkingSpotStatus();

  const isPending = isDeleting || isChangingStatus;

  // Calculate which spots can be deleted (not ASSIGNED)
  const deletableCount = selectedSpots.filter(canDeleteParkingSpot).length;
  const assignedCount = selectedSpots.filter((s) => s.status === 'ASSIGNED').length;
  const nonAssignedCount = selectedSpots.length - assignedCount;

  const handleBulkDelete = () => {
    bulkDelete(
      { ids: selectedIds },
      {
        onSuccess: () => {
          setConfirmAction(null);
          onActionComplete();
        },
        onError: () => {
          setConfirmAction(null);
        },
      }
    );
  };

  const handleBulkStatusChange = (status: ParkingSpotStatus.AVAILABLE | ParkingSpotStatus.UNDER_MAINTENANCE) => {
    bulkChangeStatus(
      { ids: selectedIds, status },
      {
        onSuccess: () => {
          setConfirmAction(null);
          onActionComplete();
        },
        onError: () => {
          setConfirmAction(null);
        },
      }
    );
  };

  const getConfirmDialogContent = () => {
    switch (confirmAction) {
      case 'delete':
        return {
          title: 'Delete Selected Parking Spots',
          description:
            assignedCount > 0
              ? `You are about to delete ${selectedIds.length} parking spots. ${assignedCount} assigned spot(s) will be skipped. ${deletableCount} spot(s) will be deleted.`
              : `Are you sure you want to delete ${selectedIds.length} parking spot(s)? This action cannot be undone.`,
          actionLabel: 'Delete',
          actionClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          onConfirm: handleBulkDelete,
        };
      case 'status-available':
        return {
          title: 'Set Status to Available',
          description:
            assignedCount > 0
              ? `You are about to change status for ${selectedIds.length} parking spots. ${assignedCount} assigned spot(s) will be skipped. ${nonAssignedCount} spot(s) will be set to Available.`
              : `Are you sure you want to set ${selectedIds.length} parking spot(s) to Available?`,
          actionLabel: 'Set Available',
          actionClass: 'bg-green-600 hover:bg-green-700',
          onConfirm: () => handleBulkStatusChange(ParkingSpotStatus.AVAILABLE),
        };
      case 'status-maintenance':
        return {
          title: 'Set Status to Under Maintenance',
          description:
            assignedCount > 0
              ? `You are about to change status for ${selectedIds.length} parking spots. ${assignedCount} assigned spot(s) will be skipped. ${nonAssignedCount} spot(s) will be set to Under Maintenance.`
              : `Are you sure you want to set ${selectedIds.length} parking spot(s) to Under Maintenance?`,
          actionLabel: 'Set Maintenance',
          actionClass: 'bg-yellow-600 hover:bg-yellow-700',
          onConfirm: () => handleBulkStatusChange(ParkingSpotStatus.UNDER_MAINTENANCE),
        };
      default:
        return null;
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <>
      <div
        className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20"
        data-testid="bulk-actions-bar"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedIds.length} parking spot{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2"
            disabled={isPending}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Status Change */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                data-testid="btn-bulk-status"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Change Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmAction('status-available')}>
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${PARKING_SPOT_STATUS_CONFIG.AVAILABLE.className}`}
                />
                Set to Available
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setConfirmAction('status-maintenance')}>
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${PARKING_SPOT_STATUS_CONFIG.UNDER_MAINTENANCE.className}`}
                />
                Set to Under Maintenance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk Delete */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmAction('delete')}
            disabled={isPending}
            data-testid="btn-bulk-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent data-testid="dialog-bulk-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={dialogContent?.onConfirm}
              disabled={isPending}
              className={dialogContent?.actionClass}
              data-testid="btn-confirm-bulk-action"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                dialogContent?.actionLabel
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
