'use client';

/**
 * Asset Status Change Dialog Component
 * Story 7.1: Asset Registry and Tracking
 * AC #22: Status dialog with dropdown, notes field, and PATCH call
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
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Loader2 } from 'lucide-react';
import { AssetStatus, type AssetDetail, type AssetListItem } from '@/types/asset';
import { useUpdateAssetStatus } from '@/hooks/useAssets';
import { getAvailableStatusOptions } from '@/lib/validations/asset';

/**
 * Status configuration for display
 */
const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; className: string }> = {
  [AssetStatus.ACTIVE]: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  [AssetStatus.UNDER_MAINTENANCE]: {
    label: 'Under Maintenance',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  [AssetStatus.OUT_OF_SERVICE]: {
    label: 'Out of Service',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  [AssetStatus.DISPOSED]: {
    label: 'Disposed',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

interface AssetStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetDetail | AssetListItem;
  onSuccess?: () => void;
}

export function AssetStatusDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AssetStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | ''>('');
  const [notes, setNotes] = useState('');
  const { mutate: updateStatus, isPending } = useUpdateAssetStatus();

  const currentStatus = asset.status;
  const availableStatuses = getAvailableStatusOptions(currentStatus);
  const currentStatusConfig = ASSET_STATUS_CONFIG[currentStatus];
  const canChange = currentStatus !== AssetStatus.DISPOSED && availableStatuses.length > 0;

  const handleStatusChange = () => {
    if (!selectedStatus || !canChange) return;

    updateStatus(
      {
        id: asset.id,
        data: {
          status: selectedStatus,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedStatus('');
          setNotes('');
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedStatus('');
      setNotes('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="asset-status-change-description"
        data-testid="dialog-asset-status"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Change Asset Status
          </DialogTitle>
          <DialogDescription id="asset-status-change-description">
            Change the status of asset <strong>{asset.assetName}</strong> ({asset.assetNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border ${currentStatusConfig.className}`}
              data-testid="current-status-badge"
            >
              {currentStatusConfig.label}
            </div>
          </div>

          {/* New Status Selection */}
          {canChange ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-asset-status">New Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as AssetStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger id="new-asset-status" data-testid="select-new-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => {
                      const config = ASSET_STATUS_CONFIG[status];
                      return (
                        <SelectItem key={status} value={status} data-testid={`status-option-${status.toLowerCase()}`}>
                          {config.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes field */}
              <div className="space-y-2">
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add notes about this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  maxLength={500}
                  data-testid="input-status-notes"
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/500 characters
                </p>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {currentStatus === AssetStatus.DISPOSED
                  ? 'Disposed assets cannot change status.'
                  : 'No status transitions available for this asset.'}
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
            data-testid="btn-cancel-status"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={!selectedStatus || !canChange || isPending}
            data-testid="btn-confirm-status"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
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
