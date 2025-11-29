'use client';

/**
 * Parking Spot Status Change Dialog Component
 * Story 3.8: Parking Spot Inventory Management
 * AC#9: Status change functionality
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RefreshCw, Loader2 } from 'lucide-react';
import type { ParkingSpot, ParkingSpotStatus } from '@/types/parking';
import { useChangeParkingSpotStatus } from '@/hooks/useParkingSpots';
import {
  PARKING_SPOT_STATUS_CONFIG,
  getAvailableStatusTransitions,
  canChangeStatus,
} from '@/types/parking';

interface ParkingSpotStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parkingSpot: ParkingSpot;
  onSuccess: () => void;
}

export function ParkingSpotStatusChangeDialog({
  open,
  onOpenChange,
  parkingSpot,
  onSuccess,
}: ParkingSpotStatusChangeDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ParkingSpotStatus | ''>('');
  const { mutate: changeStatus, isPending } = useChangeParkingSpotStatus();

  const canChange = canChangeStatus(parkingSpot);
  const availableTransitions = getAvailableStatusTransitions(parkingSpot.status);
  const currentStatusConfig = PARKING_SPOT_STATUS_CONFIG[parkingSpot.status];

  const handleStatusChange = () => {
    if (!selectedStatus || !canChange) return;

    changeStatus(
      {
        id: parkingSpot.id,
        data: { status: selectedStatus as ParkingSpotStatus.AVAILABLE | ParkingSpotStatus.UNDER_MAINTENANCE },
      },
      {
        onSuccess: () => {
          setSelectedStatus('');
          onSuccess();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedStatus('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="status-change-description"
        data-testid="dialog-status-change"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Change Status
          </DialogTitle>
          <DialogDescription id="status-change-description">
            Change the status of parking spot <strong>{parkingSpot.spotNumber}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${currentStatusConfig.className}`}
            >
              {currentStatusConfig.label}
            </div>
          </div>

          {/* New Status Selection */}
          {canChange ? (
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as ParkingSpotStatus)}
                disabled={isPending}
              >
                <SelectTrigger id="new-status" data-testid="select-new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableTransitions.map((status) => {
                    const config = PARKING_SPOT_STATUS_CONFIG[status];
                    return (
                      <SelectItem key={status} value={status}>
                        {config.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Cannot change status of an assigned parking spot. The tenant must be unassigned
                first.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={!selectedStatus || !canChange || isPending}
            data-testid="btn-confirm-status-change"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              'Change Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
