'use client';

/**
 * Document List Page
 * Story 7.2: Document Management System
 * AC #19: Document list page with table, filters, and status badges
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Eye,
  Download,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Wrench,
  Package,
  FolderOpen,
  Filter,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import { useDocuments, useDownloadDocument } from '@/hooks/useDocuments';
import {
  DocumentListItem,
  DocumentEntityType,
  DocumentAccessLevel,
  DocumentExpiryStatus,
  ENTITY_TYPE_OPTIONS,
  ACCESS_LEVEL_OPTIONS,
  getEntityTypeColor,
  getAccessLevelColor,
  getExpiryStatusColor,
  getExpiryStatusLabel,
  formatFileSize,
} from '@/types/document';

export default function DocumentsPage() {
  const router = useRouter();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');
  const [accessLevelFilter, setAccessLevelFilter] = useState<string>('ALL');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Debounce search
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearch(value);
      setCurrentPage(0);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  }, [debouncedSetSearch]);

  // Build filters
  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    entityType: entityTypeFilter !== 'ALL' ? entityTypeFilter as DocumentEntityType : undefined,
    accessLevel: accessLevelFilter !== 'ALL' ? accessLevelFilter as DocumentAccessLevel : undefined,
    expiryStatus: expiryStatusFilter !== 'ALL' ? expiryStatusFilter as 'valid' | 'expiring_soon' | 'expired' | 'all' : undefined,
    page: currentPage,
    size: pageSize,
  }), [debouncedSearch, entityTypeFilter, accessLevelFilter, expiryStatusFilter, currentPage, pageSize]);

  // Fetch documents
  const { data, isLoading, error } = useDocuments(filters);
  const { mutate: downloadDocument, isPending: isDownloading } = useDownloadDocument();

  const documents = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  // Handlers
  const handleViewDocument = (id: string) => {
    router.push(`/documents/${id}`);
  };

  const handleUploadDocument = () => {
    router.push('/documents/upload');
  };

  const handleDownload = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    downloadDocument(id);
  };

  // Entity type icon helper
  const getEntityTypeIcon = (entityType: DocumentEntityType) => {
    switch (entityType) {
      case DocumentEntityType.PROPERTY:
        return <Building2 className="h-3 w-3" />;
      case DocumentEntityType.TENANT:
        return <User className="h-3 w-3" />;
      case DocumentEntityType.VENDOR:
        return <Wrench className="h-3 w-3" />;
      case DocumentEntityType.ASSET:
        return <Package className="h-3 w-3" />;
      case DocumentEntityType.GENERAL:
      default:
        return <FolderOpen className="h-3 w-3" />;
    }
  };

  // Access level icon helper
  const getAccessLevelIcon = (accessLevel: DocumentAccessLevel) => {
    switch (accessLevel) {
      case DocumentAccessLevel.PUBLIC:
        return <Unlock className="h-3 w-3" />;
      case DocumentAccessLevel.RESTRICTED:
        return <Lock className="h-3 w-3" />;
      case DocumentAccessLevel.INTERNAL:
      default:
        return <ShieldCheck className="h-3 w-3" />;
    }
  };

  // Expiry status icon helper
  const getExpiryStatusIcon = (status: DocumentExpiryStatus) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-3 w-3" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-3 w-3" />;
      case 'expired':
        return <XCircle className="h-3 w-3" />;
      case 'no_expiry':
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="page-documents">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500">Manage and organize all documents</p>
        </div>
        <Button onClick={handleUploadDocument} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Entity Type Filter */}
            <Select
              value={entityTypeFilter}
              onValueChange={(value) => {
                setEntityTypeFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Entity Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entity Types</SelectItem>
                {ENTITY_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Access Level Filter */}
            <Select
              value={accessLevelFilter}
              onValueChange={(value) => {
                setAccessLevelFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Access Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Access Levels</SelectItem>
                {ACCESS_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Expiry Status Filter */}
            <Select
              value={expiryStatusFilter}
              onValueChange={(value) => {
                setExpiryStatusFilter(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Expiry Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Expiry Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No documents found</p>
                      <p className="text-sm">Upload your first document to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    <TableCell className="font-medium">{doc.documentNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={doc.title}>
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-slate-50">
                        {doc.documentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getEntityTypeColor(doc.entityType)} flex items-center gap-1 w-fit`}>
                        {getEntityTypeIcon(doc.entityType)}
                        {doc.entityName || ENTITY_TYPE_OPTIONS.find(o => o.value === doc.entityType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getAccessLevelColor(doc.accessLevel)} flex items-center gap-1 w-fit`}>
                        {getAccessLevelIcon(doc.accessLevel)}
                        {ACCESS_LEVEL_OPTIONS.find(o => o.value === doc.accessLevel)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.expiryDate ? (
                        <Badge className={`${getExpiryStatusColor(doc.expiryStatus)} flex items-center gap-1 w-fit`}>
                          {getExpiryStatusIcon(doc.expiryStatus)}
                          {getExpiryStatusLabel(doc.expiryStatus, doc.daysUntilExpiry)}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatFileSize(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {format(new Date(doc.uploadedAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDownloading}
                          onClick={(e) => handleDownload(e, doc.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {documents.length} of {totalElements} documents
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
