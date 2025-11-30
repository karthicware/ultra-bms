'use client';

/**
 * Compliance Requirement Detail Page
 * Story 7.3: Compliance and Inspection Tracking
 *
 * AC #34: Manage compliance requirements
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Pencil,
  Trash2,
  Clock,
  Building,
  FileText,
  Calendar,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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

import { complianceService } from '@/services/compliance.service';
import {
  type ComplianceRequirement,
  RequirementStatus,
  getCategoryLabel,
  getCategoryColor,
  getFrequencyLabel,
} from '@/types/compliance';

export default function RequirementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const requirementId = params.id as string;

  const [requirement, setRequirement] = useState<ComplianceRequirement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        setIsLoading(true);
        const requirement = await complianceService.getRequirementById(requirementId);
        setRequirement(requirement);
      } catch (error) {
        console.error('Failed to load requirement:', error);
        toast({
          title: 'Error',
          description: 'Failed to load requirement details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (requirementId) {
      fetchRequirement();
    }
  }, [requirementId, toast]);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await complianceService.deleteRequirement(requirementId);
      toast({
        title: 'Requirement Deleted',
        description: 'The requirement has been deleted successfully.',
      });
      router.push('/property-manager/compliance/requirements');
    } catch (error: unknown) {
      console.error('Failed to delete requirement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete requirement';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Requirement not found</h3>
          <p className="text-muted-foreground mb-4">
            The requirement you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const categoryColorClass = getCategoryColor(requirement.category);

  return (
    <div className="space-y-6" data-testid="requirement-detail-page">      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {requirement.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={categoryColorClass}>
              {getCategoryLabel(requirement.category)}
            </Badge>
            <Badge variant={requirement.status === RequirementStatus.ACTIVE ? 'default' : 'secondary'}>
              {requirement.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => router.push(`/property-manager/compliance/requirements/${requirementId}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirement Details */}
          <Card>
            <CardHeader>
              <CardTitle>Requirement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Category</div>
                  <Badge className={categoryColorClass}>
                    {getCategoryLabel(requirement.category)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Frequency</div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{getFrequencyLabel(requirement.frequency)}</span>
                  </div>
                </div>
                {requirement.regulatoryBody && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Regulatory Body</div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{requirement.regulatoryBody}</span>
                    </div>
                  </div>
                )}
                {requirement.referenceCode && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Reference Code</div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{requirement.referenceCode}</span>
                    </div>
                  </div>
                )}
              </div>
              {requirement.description && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Description</div>
                    <p className="text-sm leading-relaxed">{requirement.description}</p>
                  </div>
                </>
              )}
              {requirement.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Notes</div>
                    <p className="text-sm leading-relaxed">{requirement.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <ShieldCheck className={`h-8 w-8 ${requirement.status === RequirementStatus.ACTIVE ? 'text-green-500' : 'text-gray-500'}`} />
                <div>
                  <div className="font-semibold">{requirement.status}</div>
                  <div className="text-sm text-muted-foreground">
                    {requirement.status === RequirementStatus.ACTIVE
                      ? 'This requirement is actively enforced'
                      : 'This requirement is currently inactive'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/property-manager/compliance/requirements/${requirementId}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Requirement
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/property-manager/compliance')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Schedules
              </Button>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm font-medium">{formatDate(requirement.createdAt)}</div>
              </div>
              {requirement.updatedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <div className="text-sm font-medium">{formatDate(requirement.updatedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{requirement.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
