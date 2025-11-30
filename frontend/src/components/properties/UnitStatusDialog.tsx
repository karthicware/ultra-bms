/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Unit Status Dialog Component
 * Dialog for changing unit status with validation and reason
 * AC: #6 - Unit status management with transition validation
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { updateUnitStatus } from '@/services/units.service';
import { UnitStatus } from '@/types/units';
import { AlertCircle, CheckCircle2, DoorOpen } from 'lucide-react';

interface UnitStatusDialogProps {
  unitId: string;
  unitNumber: string;
  currentStatus: UnitStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Validate if status transition is allowed
 * Business rules from AC #6
 */
const isValidTransition = (from: UnitStatus, to: UnitStatus): boolean => {
  const transitions: Record<UnitStatus, UnitStatus[]> = {
    [UnitStatus.AVAILABLE]: [UnitStatus.RESERVED, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.RESERVED]: [UnitStatus.OCCUPIED, UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.OCCUPIED]: [UnitStatus.AVAILABLE, UnitStatus.UNDER_MAINTENANCE],
    [UnitStatus.UNDER_MAINTENANCE]: [UnitStatus.AVAILABLE, UnitStatus.RESERVED],
  };

  return transitions[from]?.includes(to) || false;
};

/**
 * Get status display name
 */
const getStatusDisplayName = (status: UnitStatus): string => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export function UnitStatusDialog({
  unitId,
  unitNumber,
  currentStatus,
  open,
  onOpenChange,
  onSuccess,
}: UnitStatusDialogProps) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState<UnitStatus | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get available status options
  const availableStatuses: UnitStatus[] = [];
  (['AVAILABLE', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE'] as UnitStatus[]).forEach((status) => {
    if (status !== currentStatus && isValidTransition(currentStatus, status)) {
      availableStatuses.push(status);
    }
  });

  const handleSubmit = () => {
    if (!newStatus) {
      toast({
        title: 'Error',
        description: 'Please select a new status',
        variant: 'destructive',
      });
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    if (!newStatus) return;

    try {
      setIsSubmitting(true);
      setShowConfirmation(false);

      await updateUnitStatus(unitId, { status: newStatus, reason: reason || undefined });

      toast({
        title: 'Success',
        description: `Unit ${unitNumber} status updated to ${getStatusDisplayName(newStatus)}`,
        variant: 'success',
      });

      // Reset form
      setNewStatus('');
      setReason('');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update unit status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="dialog-status-change">
          <DialogHeader>
            <DialogTitle>Change Unit Status</DialogTitle>
            <DialogDescription>
              Update the status of Unit {unitNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Status */}
            <div>
              <Label>Current Status</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <span className="font-medium">{getStatusDisplayName(currentStatus)}</span>
              </div>
            </div>

            {/* New Status */}
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status *</Label>
              {availableStatuses.length > 0 ? (
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as UnitStatus)}>
                  <SelectTrigger id="new-status" data-testid="select-unit-status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusDisplayName(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No valid status transitions available from {getStatusDisplayName(currentStatus)}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Status Transition Info */}
            {newStatus && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Valid transition:</strong>{' '}
                  {getStatusDisplayName(currentStatus)} → {getStatusDisplayName(newStatus)}
                </AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                data-testid="input-status-reason"
              />
              <p className="text-sm text-muted-foreground">
                Providing a reason helps maintain an audit trail
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!newStatus || isSubmitting}
                data-testid="btn-confirm-status-change"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change Unit {unitNumber} status from{' '}
              <strong>{getStatusDisplayName(currentStatus)}</strong> to{' '}
              <strong>{newStatus && getStatusDisplayName(newStatus)}</strong>?
              {reason && (
                <>
                  <br />
                  <br />
                  <strong>Reason:</strong> {reason}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSubmit}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
