'use client';

/**
 * ReassignmentDialog Component
 * Story 4.3: Work Order Assignment and Vendor Coordination
 *
 * Dialog for reassigning work orders to a different internal staff or external vendor
 * Features:
 * - AC #10: Reassign button replaces Assign when work order is already assigned
 * - AC #10: Required "Reason for Reassignment" text field (min 10 characters)
 * - Same tab interface as AssignmentDialog
 * - Shows current assignee information
 */

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star, Search, User, Building2, Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

import { reassignWorkOrderSchema, type ReassignWorkOrderFormData } from '@/lib/validations/work-order-assignment';
import {
  AssigneeType,
  type WorkOrder,
  type InternalStaffAssignee,
  type ExternalVendorAssignee
} from '@/types';
import {
  getInternalStaffForAssignment,
  getExternalVendorsForAssignment
} from '@/services/assignees.service';

interface ReassignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder | null;
  onReassign: (data: ReassignWorkOrderFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReassignmentDialog({
  open,
  onOpenChange,
  workOrder,
  onReassign,
  isSubmitting = false
}: ReassignmentDialogProps) {
  const [activeTab, setActiveTab] = useState<'internal' | 'vendor'>('internal');
  const [searchTerm, setSearchTerm] = useState('');
  const [internalStaff, setInternalStaff] = useState<InternalStaffAssignee[]>([]);
  const [vendors, setVendors] = useState<ExternalVendorAssignee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null);

  const form = useForm<ReassignWorkOrderFormData>({
    resolver: zodResolver(reassignWorkOrderSchema),
    defaultValues: {
      newAssigneeType: AssigneeType.INTERNAL_STAFF,
      newAssigneeId: '',
      reassignmentReason: '',
      assignmentNotes: ''
    }
  });

  // Load assignees when dialog opens
  useEffect(() => {
    if (open) {
      loadAssignees();
    } else {
      // Reset state when dialog closes
      setSearchTerm('');
      setSelectedAssignee(null);
      setActiveTab('internal');
      form.reset();
    }
  }, [open, form]);

  // Update form assigneeType when tab changes
  useEffect(() => {
    const type = activeTab === 'internal'
      ? AssigneeType.INTERNAL_STAFF
      : AssigneeType.EXTERNAL_VENDOR;
    form.setValue('newAssigneeType', type);
    setSelectedAssignee(null);
    form.setValue('newAssigneeId', '');
  }, [activeTab, form]);

  async function loadAssignees() {
    setIsLoading(true);
    try {
      const [staffData, vendorData] = await Promise.all([
        getInternalStaffForAssignment(),
        getExternalVendorsForAssignment(workOrder?.category)
      ]);
      setInternalStaff(staffData);
      setVendors(vendorData);
    } catch (error) {
      console.error('Failed to load assignees:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter internal staff by search term, excluding current assignee
  const filteredStaff = useMemo(() => {
    let staff = internalStaff;
    // Exclude current assignee if it's internal staff
    if (workOrder?.assignedTo) {
      staff = staff.filter((s) => s.id !== workOrder.assignedTo);
    }
    if (!searchTerm) return staff;
    const term = searchTerm.toLowerCase();
    return staff.filter(
      (s) =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        (s.role && s.role.toLowerCase().includes(term))
    );
  }, [internalStaff, searchTerm, workOrder?.assignedTo]);

  // Group vendors by service category, excluding current assignee
  const groupedVendors = useMemo(() => {
    let vendorList = vendors;
    // Exclude current assignee if it's a vendor
    if (workOrder?.assignedTo) {
      vendorList = vendorList.filter((v) => v.id !== workOrder.assignedTo);
    }
    const groups: Record<string, ExternalVendorAssignee[]> = {};
    vendorList.forEach((vendor) => {
      vendor.serviceCategories.forEach((category) => {
        if (!groups[category]) {
          groups[category] = [];
        }
        if (!groups[category].find((v) => v.id === vendor.id)) {
          groups[category].push(vendor);
        }
      });
    });
    return groups;
  }, [vendors, workOrder?.assignedTo]);

  function handleSelectAssignee(id: string) {
    setSelectedAssignee(id);
    form.setValue('newAssigneeId', id);
  }

  async function handleSubmit(data: ReassignWorkOrderFormData) {
    await onReassign(data);
  }

  function renderStarRating(rating: number) {
    return (
      <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">({rating.toFixed(1)})</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Reassign Work Order</DialogTitle>
          <DialogDescription>
            {workOrder && (
              <>
                Reassign <strong>{workOrder.workOrderNumber}</strong> to a different staff member or vendor.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Current Assignee Alert */}
        {workOrder?.assigneeName && (
          <Alert className="bg-muted/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Currently assigned to <strong>{workOrder.assigneeName}</strong>.
              Select a new assignee below.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 gap-4">
            {/* Tab Interface */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'internal' | 'vendor')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="internal"
                  data-testid="tab-internal-staff-reassign"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Internal Staff
                </TabsTrigger>
                <TabsTrigger
                  value="vendor"
                  data-testid="tab-external-vendor-reassign"
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  External Vendor
                </TabsTrigger>
              </TabsList>

              {/* Internal Staff Tab */}
              <TabsContent value="internal" className="mt-4">
                {/* Search/Filter */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by name, email, or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="search-internal-staff-reassign"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[200px] rounded-md border p-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <User className="h-8 w-8 mb-2" />
                      <p>No other staff members available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredStaff.map((staff) => (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => handleSelectAssignee(staff.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent ${
                            selectedAssignee === staff.id
                              ? 'border-primary bg-primary/5'
                              : 'border-transparent'
                          }`}
                          data-testid={`staff-option-reassign-${staff.id}`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={staff.avatarUrl} alt={`${staff.firstName} ${staff.lastName}`} />
                            <AvatarFallback>
                              {staff.firstName[0]}
                              {staff.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium">
                              {staff.firstName} {staff.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {staff.role || 'Staff'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* External Vendor Tab */}
              <TabsContent value="vendor" className="mt-4">
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : Object.keys(groupedVendors).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Building2 className="h-8 w-8 mb-2" />
                      <p>No other vendors available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedVendors).map(([category, categoryVendors]) => (
                        <div key={category}>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">
                            {category.replace(/_/g, ' ')}
                          </h4>
                          <div className="space-y-2">
                            {categoryVendors.map((vendor) => (
                              <button
                                key={vendor.id}
                                type="button"
                                onClick={() => handleSelectAssignee(vendor.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent ${
                                  selectedAssignee === vendor.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent'
                                }`}
                                data-testid={`vendor-option-reassign-${vendor.id}`}
                              >
                                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium">{vendor.companyName}</p>
                                  {vendor.contactPerson && (
                                    <p className="text-sm text-muted-foreground">
                                      Contact: {vendor.contactPerson.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {renderStarRating(vendor.rating)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            {/* Hidden fields for form */}
            <FormField
              control={form.control}
              name="newAssigneeType"
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <FormField
              control={form.control}
              name="newAssigneeId"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AC #10: Required Reason for Reassignment */}
            <FormField
              control={form.control}
              name="reassignmentReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Reassignment *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for reassigning this work order (minimum 10 characters)..."
                      className="resize-none"
                      rows={2}
                      data-testid="reassignment-reason"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignment Notes */}
            <FormField
              control={form.control}
              name="assignmentNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignment Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or instructions for the new assignee..."
                      className="resize-none"
                      rows={2}
                      data-testid="reassignment-notes"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected assignee display */}
            {selectedAssignee && (
              <div className="text-sm text-muted-foreground">
                New Assignee:{' '}
                <span className="font-medium text-foreground">
                  {activeTab === 'internal'
                    ? (() => {
                        const staff = filteredStaff.find((s) => s.id === selectedAssignee);
                        return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
                      })()
                    : vendors.find((v) => v.id === selectedAssignee)?.companyName || 'Unknown'}
                </span>
              </div>
            )}

            {/* Form validation errors */}
            {form.formState.errors.newAssigneeId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.newAssigneeId.message}
              </p>
            )}

            <DialogFooter className="mt-auto pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                data-testid="btn-cancel-reassignment"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedAssignee || isSubmitting}
                data-testid="btn-confirm-reassignment"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reassigning...
                  </>
                ) : (
                  'Reassign Work Order'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
