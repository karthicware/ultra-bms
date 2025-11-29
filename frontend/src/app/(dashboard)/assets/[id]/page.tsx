'use client';

/**
 * Asset Detail Page
 * Story 7.1: Asset Registry and Tracking
 * AC #19: Asset detail page with tabs for details, documents, and maintenance history
 */

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAsset, useAssetMaintenanceHistory, useDeleteAsset } from '@/hooks/useAssets';
import { assetService } from '@/services/asset.service';
import { formatAssetCurrency } from '@/types/asset';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
  Download,
  FileText,
  Wrench,
  Shield,
  AlertTriangle,
  XCircle,
  Package,
  Calendar,
  MapPin,
  Building,
  DollarSign,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AssetStatusDialog } from '@/components/assets/AssetStatusDialog';
import { AssetDocumentUploadDialog } from '@/components/assets/AssetDocumentUploadDialog';
import { RefreshCw } from 'lucide-react';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const assetId = params.id as string;

  const { data: asset, isLoading, error, refetch } = useAsset(assetId);
  const { data: maintenanceHistory } = useAssetMaintenanceHistory(assetId);
  const deleteAsset = useDeleteAsset();

  const [activeTab, setActiveTab] = useState('details');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Delete handler
  const handleDelete = async () => {
    try {
      await deleteAsset.mutateAsync(assetId);
      toast({
        title: 'Success',
        description: 'Asset deleted successfully',
      });
      router.push('/assets');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete asset',
        variant: 'destructive',
      });
    }
  };

  // Status badge
  const getStatusBadge = (status: string, displayName: string, color: string) => {
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return (
      <Badge className={`${colorMap[color] || colorMap.gray} border text-sm`}>
        {displayName}
      </Badge>
    );
  };

  // Warranty badge
  const getWarrantyBadge = (warrantyStatus: string | null, daysRemaining: number | null) => {
    if (!warrantyStatus || warrantyStatus === 'NO_WARRANTY') {
      return <Badge variant="outline" className="text-gray-500" data-testid="badge-warranty-status">No Warranty</Badge>;
    }

    const config: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      ACTIVE: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <Shield className="h-4 w-4 mr-1" />,
        label: daysRemaining ? `${daysRemaining} days remaining` : 'Active',
      },
      EXPIRING_SOON: {
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="h-4 w-4 mr-1" />,
        label: daysRemaining ? `Expires in ${daysRemaining} days` : 'Expiring Soon',
      },
      EXPIRED: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-4 w-4 mr-1" />,
        label: 'Expired',
      },
    };

    const c = config[warrantyStatus] || config.EXPIRED;
    return (
      <Badge className={`${c.className} border flex items-center`} data-testid="badge-warranty-status">
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">Asset not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/assets')}>
          Back to Assets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-asset-detail">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/assets')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{asset.assetName}</h1>
              {getStatusBadge(asset.status, asset.statusDisplayName || asset.status, asset.statusColor || 'gray')}
            </div>
            <p className="text-gray-500">{asset.assetNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {asset.editable && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(true)}
                data-testid="btn-change-status"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Status
              </Button>
              <Button variant="outline" onClick={() => router.push(`/assets/${assetId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this asset? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700">
                      {asset.categoryDisplayName}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(asset.status, asset.statusDisplayName || asset.status, asset.statusColor || 'gray')}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Building className="h-4 w-4" /> Property
                  </p>
                  <p className="font-medium">{asset.propertyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Location
                  </p>
                  <p className="font-medium">{asset.location}</p>
                </div>
                {asset.statusNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Status Notes</p>
                    <p className="text-gray-700">{asset.statusNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equipment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.manufacturer && (
                  <div>
                    <p className="text-sm text-gray-500">Manufacturer</p>
                    <p className="font-medium">{asset.manufacturer}</p>
                  </div>
                )}
                {asset.modelNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Model Number</p>
                    <p className="font-medium">{asset.modelNumber}</p>
                  </div>
                )}
                {asset.serialNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Serial Number</p>
                    <p className="font-medium font-mono">{asset.serialNumber}</p>
                  </div>
                )}
                {asset.installationDate && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Installation Date
                    </p>
                    <p className="font-medium">
                      {format(new Date(asset.installationDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Warranty & Financial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Warranty Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Warranty Status</p>
                  <div className="mt-1">
                    {getWarrantyBadge(asset.warrantyStatus, asset.warrantyDaysRemaining ?? null)}
                  </div>
                </div>
                {asset.warrantyExpiryDate && (
                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-medium">
                      {format(new Date(asset.warrantyExpiryDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {asset.purchaseCost && (
                  <div>
                    <p className="text-sm text-gray-500">Purchase Cost</p>
                    <p className="font-medium text-lg">{formatAssetCurrency(asset.purchaseCost)}</p>
                  </div>
                )}
                {asset.estimatedUsefulLife && (
                  <div>
                    <p className="text-sm text-gray-500">Estimated Useful Life</p>
                    <p className="font-medium">{asset.estimatedUsefulLife} years</p>
                  </div>
                )}
                {asset.maintenanceSummary && (
                  <div>
                    <p className="text-sm text-gray-500">Total Maintenance Cost</p>
                    <p className="font-medium text-lg">
                      {formatAssetCurrency(asset.maintenanceSummary.totalMaintenanceCost)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Summary */}
          {asset.maintenanceSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {asset.maintenanceSummary.totalWorkOrders}
                    </p>
                    <p className="text-sm text-gray-500">Total Work Orders</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {asset.maintenanceSummary.completedWorkOrders}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">
                      {formatAssetCurrency(asset.maintenanceSummary.totalMaintenanceCost)}
                    </p>
                    <p className="text-sm text-gray-500">Total Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documents</CardTitle>
              <Button
                onClick={() => setShowUploadDialog(true)}
                data-testid="btn-upload-document"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              {asset.documents && asset.documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {asset.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            {doc.fileName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell>{doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : '-'}</TableCell>
                        <TableCell>
                          {doc.uploadedAt && format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const url = await assetService.getDocumentDownloadUrl(asset.id, doc.id);
                              window.open(url, '_blank');
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No documents uploaded yet. Upload manuals, warranty documents, or invoices.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance History Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maintenance History</CardTitle>
              <CardDescription>Work orders linked to this asset</CardDescription>
            </CardHeader>
            <CardContent>
              {!maintenanceHistory?.data?.content || maintenanceHistory.data.content.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No maintenance history for this asset.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Work Order #</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceHistory.data.content.map((wo) => (
                      <TableRow key={wo.id}>
                        <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                        <TableCell>{wo.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{wo.status}</Badge>
                        </TableCell>
                        <TableCell>{wo.vendorName || '-'}</TableCell>
                        <TableCell>{wo.actualCost ? formatAssetCurrency(wo.actualCost) : '-'}</TableCell>
                        <TableCell>
                          {wo.createdAt && format(new Date(wo.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      {asset && (
        <AssetStatusDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          asset={asset}
          onSuccess={() => refetch()}
        />
      )}

      {/* Document Upload Dialog */}
      {asset && (
        <AssetDocumentUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          assetId={asset.id}
          assetName={asset.assetName}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
