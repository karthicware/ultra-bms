'use client';

/**
 * Document Upload Page
 * Story 7.2: Document Management System
 * AC #21: Document upload form with file selection, metadata, entity linking
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Upload,
  FileText,
  X,
  Plus,
  Calendar,
  Tag,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useUploadDocument } from '@/hooks/useDocuments';
import {
  documentUploadSchema,
  documentUploadDefaults,
  DocumentUploadFormData,
  DocumentUploadFormInput,
  validateDocumentFile,
  createDocumentUploadFormData,
} from '@/lib/validations/document';
import {
  DocumentEntityType,
  DocumentAccessLevel,
  ENTITY_TYPE_OPTIONS,
  ACCESS_LEVEL_OPTIONS,
  COMMON_DOCUMENT_TYPES,
  formatFileSize,
  MAX_DOCUMENT_FILE_SIZE_MB,
  ALLOWED_DOCUMENT_FILE_EXTENSIONS,
} from '@/types/document';

export default function DocumentUploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const { mutate: uploadDocument, isPending: isUploading, uploadProgress } = useUploadDocument();

  const form = useForm<DocumentUploadFormInput>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: documentUploadDefaults,
  });

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = form;
  const watchEntityType = watch('entityType');
  const watchTags = watch('tags') || [];

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFileError(null);
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validation = validateDocumentFile(file);
      if (!validation.valid) {
        setFileError(validation.error || 'Invalid file');
        return;
      }
      setSelectedFile(file);
      // Auto-fill title if empty
      if (!form.getValues('title')) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setValue('title', nameWithoutExt);
      }
    }
  }, [setValue, form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  // Tag handlers
  const handleAddTag = () => {
    if (tagInput.trim() && watchTags.length < 10) {
      const newTag = tagInput.trim();
      if (!watchTags.includes(newTag)) {
        setValue('tags', [...watchTags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', watchTags.filter((tag: string) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Form submission
  const onSubmit = (data: DocumentUploadFormInput) => {
    if (!selectedFile) {
      setFileError('Please select a file');
      return;
    }

    // After zod validation, data has all defaults applied - safe to cast to output type
    const validatedData = data as DocumentUploadFormData;
    const formData = createDocumentUploadFormData(validatedData, selectedFile);

    uploadDocument(formData, {
      onSuccess: (document) => {
        router.push(`/documents/${document.id}`);
      },
    });
  };

  const handleBack = () => {
    router.push('/documents');
  };

  // Access level icon
  const getAccessLevelIcon = (level: DocumentAccessLevel) => {
    switch (level) {
      case DocumentAccessLevel.PUBLIC:
        return <Unlock className="h-4 w-4" />;
      case DocumentAccessLevel.RESTRICTED:
        return <Lock className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto space-y-6" data-testid="page-document-upload">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
          <p className="text-gray-500">Add a new document to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - File Upload & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Allowed: {ALLOWED_DOCUMENT_FILE_EXTENSIONS.join(', ')} (max {MAX_DOCUMENT_FILE_SIZE_MB}MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FileText className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">File ready to upload</span>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : fileError
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${fileError ? 'text-red-400' : 'text-gray-400'}`} />
                    {isDragActive ? (
                      <p className="text-blue-600 font-medium">Drop the file here...</p>
                    ) : (
                      <>
                        <p className="text-gray-600">Drag and drop a file here, or click to select</p>
                        <p className="text-sm text-gray-400 mt-2">
                          PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max {MAX_DOCUMENT_FILE_SIZE_MB}MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
                {fileError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{fileError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...register('title')}
                      placeholder="Enter document title"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">{errors.title.message}</p>
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
                          <SelectTrigger>
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
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Enter document description (optional)"
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Expiry Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register('expiryDate')}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-red-500">{errors.expiryDate.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave empty if the document doesnt expire
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add a tag..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim() || watchTags.length >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {watchTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchTags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
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
                  <p className="text-xs text-gray-500">
                    Press Enter or click + to add tags (max 10)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Entity & Access */}
          <div className="space-y-6">
            {/* Entity Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Entity Assignment</CardTitle>
                <CardDescription>
                  Link this document to a specific entity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Entity Type */}
                <div className="space-y-2">
                  <Label>Entity Type *</Label>
                  <Controller
                    name="entityType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear entityId when changing type
                          setValue('entityId', '');
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ENTITY_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.entityType && (
                    <p className="text-sm text-red-500">{errors.entityType.message}</p>
                  )}
                </div>

                {/* Entity ID - Only show if not GENERAL */}
                {watchEntityType !== DocumentEntityType.GENERAL && (
                  <div className="space-y-2">
                    <Label htmlFor="entityId">
                      {ENTITY_TYPE_OPTIONS.find(o => o.value === watchEntityType)?.label} *
                    </Label>
                    <Input
                      id="entityId"
                      {...register('entityId')}
                      placeholder={`Enter ${watchEntityType.toLowerCase()} ID`}
                    />
                    {errors.entityId && (
                      <p className="text-sm text-red-500">{errors.entityId.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Enter the UUID of the {watchEntityType.toLowerCase()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Access Level */}
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
                <CardDescription>
                  Set who can view and download this document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Controller
                  name="accessLevel"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {ACCESS_LEVEL_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            field.value === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="accessLevel"
                            value={option.value}
                            checked={field.value === option.value}
                            onChange={() => field.onChange(option.value)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-medium">
                              {getAccessLevelIcon(option.value)}
                              {option.label}
                            </div>
                            <p className="text-sm text-gray-500">{option.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                {isUploading && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleBack}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
