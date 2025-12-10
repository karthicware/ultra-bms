/**
 * Document Edit Page
 * Story 7.2: Document Management System (AC #22)
 *
 * Pre-populate form with existing values.
 * Allow editing: title, description, documentType, expiryDate, tags, accessLevel
 * Cannot change: documentNumber, file, entityType, entityId (show as read-only)
 * "Replace Document" button opens replace dialog
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  FileText,
  X,
  Plus,
  Calendar as CalendarIcon,
  Tag,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { PageBackButton } from '@/components/common/PageBackButton';
import { useDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { DocumentReplaceDialog } from '@/components/documents';
import {
  documentUpdateSchema,
  DocumentUpdateFormData,
  DocumentUpdateFormInput
} from '@/lib/validations/document';
import {
  DocumentAccessLevel,
  ACCESS_LEVEL_OPTIONS,
  COMMON_DOCUMENT_TYPES,
  formatFileSize,
} from '@/types/document';
import { EntityTypeBadge } from '@/components/documents';
import { cn } from '@/lib/utils';

export default function DocumentEditPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.id as string;

  // State
  const [tagInput, setTagInput] = useState('');
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // Queries
  const { data: document, isLoading, error } = useDocument(documentId);

  // Mutations
  const { mutate: updateDocument, isPending: isUpdating } = useUpdateDocument();

  // Form setup
  const form = useForm<DocumentUpdateFormInput>({
    resolver: zodResolver(documentUpdateSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      documentType: '',
      expiryDate: undefined,
      tags: [],
      accessLevel: DocumentAccessLevel.PUBLIC
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isDirty }
  } = form;

  const watchTags = watch('tags') || [];
  const watchExpiryDate = watch('expiryDate');

  // Populate form when document is loaded
  useEffect(() => {
    if (document) {
      reset({
        title: document.title,
        description: document.description || '',
        documentType: document.documentType,
        expiryDate: document.expiryDate || undefined,
        tags: document.tags || [],
        accessLevel: document.accessLevel
      });
    }
  }, [document, reset]);

  // Handlers
  const handleBack = () => {
    router.push(`/documents/${documentId}`);
  };

  const onSubmit = (data: DocumentUpdateFormInput) => {
    // After zod validation, data has all defaults applied - safe to cast to output type
    const validatedData = data as DocumentUpdateFormData;
    updateDocument(
      {
        documentId,
        data: {
          title: validatedData.title,
          description: validatedData.description || undefined,
          documentType: validatedData.documentType,
          expiryDate: validatedData.expiryDate || undefined,
          tags: validatedData.tags,
          accessLevel: validatedData.accessLevel
        }
      },
      {
        onSuccess: () => {
          router.push(`/documents/${documentId}`);
        }
      }
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !watchTags.includes(tagInput.trim())) {
      setValue('tags', [...watchTags, tagInput.trim()], { shouldDirty: true });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      watchTags.filter((tag) => tag !== tagToRemove),
      { shouldDirty: true }
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6" data-testid="form-document-edit">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center h-64 text-gray-500" data-testid="form-document-edit">
        <FileText className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Document not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/documents')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6" data-testid="form-document-edit">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <PageBackButton href={`/documents/${documentId}`} aria-label="Back to document" />
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
            </div>
            <p className="text-muted-foreground mt-2">{document.documentNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReplaceDialog(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Replace File
          </Button>
          <Button variant="outline" onClick={handleBack}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isUpdating || !isDirty}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>Update the document metadata</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="Enter document title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter document description"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.documentType ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.documentType && (
                    <p className="text-sm text-red-500">{errors.documentType.message}</p>
                  )}
                </div>

                {/* Access Level */}
                <div className="space-y-2">
                  <Label htmlFor="accessLevel">Access Level *</Label>
                  <Controller
                    name="accessLevel"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className={errors.accessLevel ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span>{option.label}</span>
                                <span className="text-xs text-gray-500">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.accessLevel && (
                    <p className="text-sm text-red-500">{errors.accessLevel.message}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Controller
                    name="expiryDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(new Date(field.value), 'PPP') : 'Select expiry date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {watchExpiryDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => setValue('expiryDate', undefined, { shouldDirty: true })}
                    >
                      Clear expiry date
                    </Button>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add a tag"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {watchTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Read-only fields */}
        <div className="space-y-6">
          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Information
              </CardTitle>
              <CardDescription>Read-only file details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Document Number</label>
                <p className="mt-1 text-gray-900 font-mono">{document.documentNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">File Name</label>
                <p className="mt-1 text-gray-900 truncate" title={document.fileName}>
                  {document.fileName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">File Size</label>
                <p className="mt-1 text-gray-900">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">File Type</label>
                <p className="mt-1 text-gray-900">{document.fileType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Version</label>
                <p className="mt-1 text-gray-900">v{document.version}</p>
              </div>
            </CardContent>
          </Card>

          {/* Entity Information */}
          <Card>
            <CardHeader>
              <CardTitle>Entity Information</CardTitle>
              <CardDescription>Read-only entity details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Entity Type</label>
                <div className="mt-1">
                  <EntityTypeBadge entityType={document.entityType} />
                </div>
              </div>
              {document.entityName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Entity</label>
                  <p className="mt-1 text-gray-900">{document.entityName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Information */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Uploaded By</label>
                <p className="mt-1 text-gray-900">{document.uploaderName || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Uploaded At</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(document.uploadedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Replace Dialog */}
      <DocumentReplaceDialog
        open={showReplaceDialog}
        onOpenChange={setShowReplaceDialog}
        documentId={documentId}
        currentFileName={document.fileName}
        currentFileSize={document.fileSize}
        currentVersion={document.version}
        onSuccess={() => {
          // Optionally refresh the document data
        }}
      />
    </div>
  );
}
