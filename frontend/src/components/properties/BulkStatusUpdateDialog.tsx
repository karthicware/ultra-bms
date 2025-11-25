'use client';

/**
 * Bulk Status Update Dialog Component
 * Dialog for updating multiple units' statuses at once
 * AC: #7 - Bulk status update with validation and progress tracking
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
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { bulkUpdateUnitStatus } from '@/services/units.service';
import { UnitStatus } from '@/types/units';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface BulkStatusUpdateDialogProps {
  unitIds: string[];
  unitCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Get status display name
 */
const getStatusDisplayName = (status: UnitStatus): string => {
  return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export function BulkStatusUpdateDialog({
  unitIds,
  unitCount,
  open,
  onOpenChange,
  onSuccess,
}: BulkStatusUpdateDialogProps) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState<UnitStatus | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ unitId: string; unitNumber: string; reason: string; }>;
  } | null>(null);

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
      setProgress(0);
      setResult(null);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await bulkUpdateUnitStatus({ unitIds, newStatus, reason: reason || undefined });

      clearInterval(progressInterval);
      setProgress(100);

      const successCount = response.successCount || 0;
      const failedCount = response.failureCount || 0;
      const errors = response.failures || [];

      setResult({
        success: successCount,
        failed: failedCount,
        errors,
      });

      if (failedCount === 0) {
        toast({
          title: 'Success',
          description: `Updated ${successCount} units to ${getStatusDisplayName(newStatus)}`,
        });

        setTimeout(() => {
          setNewStatus('');
          setReason('');
          onOpenChange(false);
          setResult(null);

          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        toast({
          title: 'Partial Success',
          description: `Updated ${successCount} of ${unitCount} units`,
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update unit statuses',
        variant: 'destructive',
      });
      setResult({
        success: 0,
        failed: unitCount,
        errors: [error.response?.data?.error?.message || 'Unknown error'],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl" data-testid="dialog-bulk-status">
          <DialogHeader>
            <DialogTitle>Bulk Status Update</DialogTitle>
            <DialogDescription>
              Update the status of {unitCount} selected unit{unitCount > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected Units Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{unitCount} unit{unitCount > 1 ? 's' : ''} selected</strong>
                <br />
                All selected units will be updated to the same status
              </AlertDescription>
            </Alert>

            {/* New Status */}
            <div className="space-y-2">
              <Label htmlFor="bulk-new-status">New Status *</Label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as UnitStatus)}>
                <SelectTrigger id="bulk-new-status" data-testid="select-bulk-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Note: Invalid transitions for some units may be skipped
              </p>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Reason (Optional)</Label>
              <Textarea
                id="bulk-reason"
                placeholder="Enter reason for status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                data-testid="input-bulk-reason"
              />
            </div>

            {/* Progress */}
            {isSubmitting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Updating units...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {result.failed === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="font-semibold">
                    Updated {result.success} of {result.success + result.failed} units
                  </span>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-semibold">{result.failed} units failed:</p>
                        <ul className="list-disc list-inside text-sm">
                          {result.errors.slice(0, 5).map((error, idx) => (
                            <li key={idx}>Unit {error.unitNumber}: {error.reason}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>...and {result.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {result ? 'Close' : 'Cancel'}
              </Button>
              {!result && (
                <Button
                  onClick={handleSubmit}
                  disabled={!newStatus || isSubmitting}
                  data-testid="btn-confirm-bulk-update"
                >
                  Update {unitCount} Unit{unitCount > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update {unitCount} unit{unitCount > 1 ? 's' : ''} to{' '}
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
