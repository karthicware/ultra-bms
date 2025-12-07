'use client';

/**
 * Step 5: Document Upload
 * Upload required and optional documents
 * SCP-2025-12-07: Redesigned to match quotation creation page with:
 * - Separate front/back uploads for Emirates ID and Passport
 * - FileUploadProgress component with thumbnail previews
 * - Support for viewing/replacing preloaded documents from quotation
 * - Uses presigned URLs from quotations API for viewing/thumbnails
 */

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  X,
  CheckCircle2,
  FileText,
  Download,
  RefreshCw,
  CreditCard,
  Shield,
  FileCheck,
  Files,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

import { FileUploadProgress } from '@/components/ui/file-upload-progress';
import { getQuotationDocumentUrl } from '@/services/quotations.service';
import type { TenantDocumentUploadFormData } from '@/types/tenant';

// SCP-2025-12-06: Preloaded document paths from quotation
interface PreloadedDocuments {
  emiratesIdFrontPath?: string;
  emiratesIdBackPath?: string;
  passportFrontPath?: string;
  passportBackPath?: string;
}

interface DocumentUploadStepProps {
  data: TenantDocumentUploadFormData;
  onComplete: (data: TenantDocumentUploadFormData) => void;
  onBack: () => void;
  preloadedDocuments?: PreloadedDocuments;
}

// Helper to extract filename from S3 path
const getFileNameFromPath = (path: string | undefined): string => {
  if (!path) return 'Document';
  const parts = path.split('/');
  return parts[parts.length - 1] || 'Document';
};

// Helper to check if path is an image
const isImagePath = (path: string | undefined): boolean => {
  if (!path) return false;
  const ext = path.toLowerCase().split('.').pop();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};

export function DocumentUploadStep({ data, onComplete, onBack, preloadedDocuments }: DocumentUploadStepProps) {
  // Separate front/back uploads for Emirates ID
  const [emiratesIdFront, setEmiratesIdFront] = useState<File | null>(null);
  const [emiratesIdBack, setEmiratesIdBack] = useState<File | null>(null);

  // Separate front/back uploads for Passport
  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);

  // Other documents
  const [visaFile, setVisaFile] = useState<File | null>(data.visaFile ?? null);
  const [signedLeaseFile, setSignedLeaseFile] = useState<File | null>(data.signedLeaseFile);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>(data.additionalFiles || []);

  // Track if user wants to replace preloaded documents
  const [replaceEmiratesIdFront, setReplaceEmiratesIdFront] = useState(false);
  const [replaceEmiratesIdBack, setReplaceEmiratesIdBack] = useState(false);
  const [replacePassportFront, setReplacePassportFront] = useState(false);
  const [replacePassportBack, setReplacePassportBack] = useState(false);

  // Presigned URLs for preloaded documents
  const [presignedUrls, setPresignedUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(false);

  // Check preloaded status
  const hasPreloadedEmiratesIdFront = !!preloadedDocuments?.emiratesIdFrontPath;
  const hasPreloadedEmiratesIdBack = !!preloadedDocuments?.emiratesIdBackPath;
  const hasPreloadedPassportFront = !!preloadedDocuments?.passportFrontPath;
  const hasPreloadedPassportBack = !!preloadedDocuments?.passportBackPath;

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load presigned URLs for preloaded documents
  useEffect(() => {
    const loadPresignedUrls = async () => {
      if (!preloadedDocuments) return;

      const paths = [
        preloadedDocuments.emiratesIdFrontPath,
        preloadedDocuments.emiratesIdBackPath,
        preloadedDocuments.passportFrontPath,
        preloadedDocuments.passportBackPath,
      ].filter(Boolean) as string[];

      if (paths.length === 0) return;

      setLoadingUrls(true);
      const urls: Record<string, string> = {};

      await Promise.all(
        paths.map(async (path) => {
          try {
            const url = await getQuotationDocumentUrl(path);
            urls[path] = url;
          } catch (error) {
            console.error(`Failed to get presigned URL for ${path}:`, error);
          }
        })
      );

      setPresignedUrls(urls);
      setLoadingUrls(false);
    };

    loadPresignedUrls();
  }, [preloadedDocuments]);

  const onSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Validate Emirates ID (at least front required)
    const hasEmiratesIdFrontDoc = emiratesIdFront !== null || (hasPreloadedEmiratesIdFront && !replaceEmiratesIdFront);
    if (!hasEmiratesIdFrontDoc) {
      newErrors.emiratesIdFront = replaceEmiratesIdFront
        ? 'Please upload Emirates ID front or cancel replacement'
        : 'Emirates ID front is required';
    }

    // Validate Passport (at least front required)
    const hasPassportFrontDoc = passportFront !== null || (hasPreloadedPassportFront && !replacePassportFront);
    if (!hasPassportFrontDoc) {
      newErrors.passportFront = replacePassportFront
        ? 'Please upload Passport front or cancel replacement'
        : 'Passport front is required';
    }

    // Validate Signed Lease
    if (!signedLeaseFile) {
      newErrors.signedLease = 'Signed lease agreement is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Combine front/back into single files for backward compatibility
    // The backend will need to handle these separately in the future
    onComplete({
      emiratesIdFile: emiratesIdFront, // Primary file
      emiratesIdBackFile: emiratesIdBack, // New field for back
      passportFile: passportFront, // Primary file
      passportBackFile: passportBack, // New field for back
      visaFile,
      signedLeaseFile,
      additionalFiles,
    } as TenantDocumentUploadFormData);
  };

  const handleAdditionalFileAdd = (file: File | null) => {
    if (file && additionalFiles.length < 5) {
      setAdditionalFiles([...additionalFiles, file]);
    }
  };

  const handleAdditionalFileRemove = (index: number) => {
    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
  };

  // Component to display preloaded document with thumbnail
  const PreloadedDocumentCard = ({
    path,
    label,
    onReplace,
  }: {
    path: string;
    label: string;
    onReplace: () => void;
  }) => {
    const isImage = isImagePath(path);
    const fileName = getFileNameFromPath(path);
    // Use presigned URL from state, fallback to empty string
    const presignedUrl = presignedUrls[path] || '';

    // Show loading state while URLs are being fetched
    if (loadingUrls) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-destructive">*</span>
          </div>
          <div className="relative rounded-2xl border-2 border-muted bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <span className="text-destructive">*</span>
        </div>
        <div className="relative rounded-2xl border-2 border-green-500/50 bg-green-500/5 p-4 transition-all">
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="relative shrink-0">
              {isImage && presignedUrl ? (
                <div className="h-14 w-14 overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={presignedUrl}
                    alt={label}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                      const sibling = (e.target as HTMLImageElement).nextElementSibling;
                      if (sibling) sibling.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden h-full w-full items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {/* Success overlay */}
              <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
              </div>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-green-600">From Quotation</p>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {presignedUrl ? (
                <a
                  href={presignedUrl}
                  download={fileName}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-primary/10 text-primary"
                  title="Download document"
                >
                  <Download className="h-4 w-4" />
                </a>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-orange-500/10 hover:text-orange-600"
                onClick={onReplace}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Component for replacement mode header
  const ReplacementHeader = ({
    onCancel,
  }: {
    onCancel: () => void;
  }) => (
    <div className="flex items-center justify-between mb-2 px-1">
      <p className="text-sm text-orange-600">Replacing document...</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-7 text-xs hover:bg-orange-500/10 hover:text-orange-600"
      >
        <X className="h-3 w-3 mr-1" />
        Cancel
      </Button>
    </div>
  );

  return (
    <Card data-testid="step-document-upload">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload required identity and lease documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All documents should be scanned copies of physical documents.
              Ensure files are clear and readable. Supported formats: PDF, JPG, PNG (max 5MB).
            </AlertDescription>
          </Alert>

          {/* Emirates ID Section */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Emirates ID / National ID</h3>
                <p className="text-sm text-muted-foreground">Upload front and back sides</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emirates ID Front */}
              {hasPreloadedEmiratesIdFront && !replaceEmiratesIdFront ? (
                <PreloadedDocumentCard
                  path={preloadedDocuments!.emiratesIdFrontPath!}
                  label="Front Side"
                  onReplace={() => setReplaceEmiratesIdFront(true)}
                />
              ) : (
                <div>
                  {replaceEmiratesIdFront && hasPreloadedEmiratesIdFront && (
                    <ReplacementHeader onCancel={() => {
                      setReplaceEmiratesIdFront(false);
                      setEmiratesIdFront(null);
                    }} />
                  )}
                  <FileUploadProgress
                    onFileSelect={setEmiratesIdFront}
                    selectedFile={emiratesIdFront}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                    maxSize={5 * 1024 * 1024}
                    label="Front Side"
                    required
                    testId="upload-emirates-id-front"
                    uploadStatus={emiratesIdFront ? 'success' : 'idle'}
                    errorMessage={errors.emiratesIdFront}
                  />
                </div>
              )}

              {/* Emirates ID Back */}
              {hasPreloadedEmiratesIdBack && !replaceEmiratesIdBack ? (
                <PreloadedDocumentCard
                  path={preloadedDocuments!.emiratesIdBackPath!}
                  label="Back Side"
                  onReplace={() => setReplaceEmiratesIdBack(true)}
                />
              ) : (
                <div>
                  {replaceEmiratesIdBack && hasPreloadedEmiratesIdBack && (
                    <ReplacementHeader onCancel={() => {
                      setReplaceEmiratesIdBack(false);
                      setEmiratesIdBack(null);
                    }} />
                  )}
                  <FileUploadProgress
                    onFileSelect={setEmiratesIdBack}
                    selectedFile={emiratesIdBack}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                    maxSize={5 * 1024 * 1024}
                    label="Back Side"
                    testId="upload-emirates-id-back"
                    uploadStatus={emiratesIdBack ? 'success' : 'idle'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Passport Section */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Passport</h3>
                <p className="text-sm text-muted-foreground">Upload front and back sides</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Passport Front */}
              {hasPreloadedPassportFront && !replacePassportFront ? (
                <PreloadedDocumentCard
                  path={preloadedDocuments!.passportFrontPath!}
                  label="Front Side"
                  onReplace={() => setReplacePassportFront(true)}
                />
              ) : (
                <div>
                  {replacePassportFront && hasPreloadedPassportFront && (
                    <ReplacementHeader onCancel={() => {
                      setReplacePassportFront(false);
                      setPassportFront(null);
                    }} />
                  )}
                  <FileUploadProgress
                    onFileSelect={setPassportFront}
                    selectedFile={passportFront}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                    maxSize={5 * 1024 * 1024}
                    label="Front Side"
                    required
                    testId="upload-passport-front"
                    uploadStatus={passportFront ? 'success' : 'idle'}
                    errorMessage={errors.passportFront}
                  />
                </div>
              )}

              {/* Passport Back */}
              {hasPreloadedPassportBack && !replacePassportBack ? (
                <PreloadedDocumentCard
                  path={preloadedDocuments!.passportBackPath!}
                  label="Back Side"
                  onReplace={() => setReplacePassportBack(true)}
                />
              ) : (
                <div>
                  {replacePassportBack && hasPreloadedPassportBack && (
                    <ReplacementHeader onCancel={() => {
                      setReplacePassportBack(false);
                      setPassportBack(null);
                    }} />
                  )}
                  <FileUploadProgress
                    onFileSelect={setPassportBack}
                    selectedFile={passportBack}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                    maxSize={5 * 1024 * 1024}
                    label="Back Side"
                    testId="upload-passport-back"
                    uploadStatus={passportBack ? 'success' : 'idle'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Visa Section (Optional) */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Visa Copy</h3>
                <p className="text-sm text-muted-foreground">Optional - Upload if applicable</p>
              </div>
            </div>

            <FileUploadProgress
              onFileSelect={setVisaFile}
              selectedFile={visaFile}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
              maxSize={5 * 1024 * 1024}
              label="Visa Document"
              testId="upload-visa"
              uploadStatus={visaFile ? 'success' : 'idle'}
            />
          </div>

          {/* Signed Lease Section */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Signed Lease Agreement</h3>
                <p className="text-sm text-muted-foreground">Scanned PDF of physically signed lease</p>
              </div>
            </div>

            <FileUploadProgress
              onFileSelect={setSignedLeaseFile}
              selectedFile={signedLeaseFile}
              accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }}
              maxSize={10 * 1024 * 1024}
              label="Lease Agreement"
              required
              testId="upload-signed-lease"
              uploadStatus={signedLeaseFile ? 'success' : 'idle'}
              errorMessage={errors.signedLease}
            />
          </div>

          {/* Additional Documents Section */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Files className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Additional Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Optional - salary certificate, bank statements, etc. (max 5 files)
                </p>
              </div>
            </div>

            {/* Existing additional files */}
            {additionalFiles.length > 0 && (
              <div className="space-y-2 mb-4">
                {additionalFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-xl bg-background"
                    data-testid={`additional-file-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleAdditionalFileRemove(index)}
                      data-testid={`btn-remove-additional-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add more button */}
            {additionalFiles.length < 5 && (
              <FileUploadProgress
                onFileSelect={handleAdditionalFileAdd}
                selectedFile={null}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                maxSize={5 * 1024 * 1024}
                label={`Add Document (${additionalFiles.length}/5)`}
                testId="upload-additional"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              data-testid="btn-back"
            >
              Back
            </Button>
            <Button onClick={onSubmit} data-testid="btn-next">
              Next: Review & Submit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
