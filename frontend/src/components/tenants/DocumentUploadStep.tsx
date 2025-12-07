'use client';

/**
 * Step 6: Document Upload
 * Upload required and optional documents
 * Updated: shadcn-studio form styling (SCP-2025-11-30) - uses FileUploadZone component
 * SCP-2025-12-06: Added support for preloaded documents from quotation conversion
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X, CheckCircle2, FileText, ExternalLink } from 'lucide-react';

import { FileUploadZone } from './FileUploadZone';
import { documentUploadSchema } from '@/lib/validations/tenant';
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

export function DocumentUploadStep({ data, onComplete, onBack, preloadedDocuments }: DocumentUploadStepProps) {
  const [emiratesIdFile, setEmiratesIdFile] = useState<File | null>(data.emiratesIdFile);
  const [passportFile, setPassportFile] = useState<File | null>(data.passportFile);
  const [visaFile, setVisaFile] = useState<File | null>(data.visaFile ?? null);
  const [signedLeaseFile, setSignedLeaseFile] = useState<File | null>(data.signedLeaseFile);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>(data.additionalFiles || []);

  // SCP-2025-12-06: Check if documents are preloaded from quotation
  const hasPreloadedEmiratesId = !!(preloadedDocuments?.emiratesIdFrontPath || preloadedDocuments?.emiratesIdBackPath);
  const hasPreloadedPassport = !!(preloadedDocuments?.passportFrontPath || preloadedDocuments?.passportBackPath);

  const form = useForm<TenantDocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: data,
  });

  const onSubmit = () => {
    // Validate manually since we're using custom file inputs
    // SCP-2025-12-06: Accept preloaded documents from quotation as valid
    const hasEmiratesId = emiratesIdFile !== null || hasPreloadedEmiratesId;
    const hasPassport = passportFile !== null || hasPreloadedPassport;
    const hasSignedLease = signedLeaseFile !== null;

    if (!hasEmiratesId || !hasPassport || !hasSignedLease) {
      if (!hasEmiratesId) {
        form.setError('emiratesIdFile', {
          message: 'Emirates ID is required',
        });
      }
      if (!hasPassport) {
        form.setError('passportFile', {
          message: 'Passport is required',
        });
      }
      if (!hasSignedLease) {
        form.setError('signedLeaseFile', {
          message: 'Signed lease agreement is required',
        });
      }
      return;
    }

    onComplete({
      emiratesIdFile,
      passportFile,
      visaFile,
      signedLeaseFile,
      additionalFiles,
    });
  };

  const handleAdditionalFileAdd = (file: File | null) => {
    if (file && additionalFiles.length < 5) {
      setAdditionalFiles([...additionalFiles, file]);
    }
  };

  const handleAdditionalFileRemove = (index: number) => {
    setAdditionalFiles(additionalFiles.filter((_, i) => i !== index));
  };

  // SCP-2025-12-06: Helper to extract filename from S3 path
  const getFileNameFromPath = (path: string | undefined): string => {
    if (!path) return 'Document';
    const parts = path.split('/');
    return parts[parts.length - 1] || 'Document';
  };

  // SCP-2025-12-06: Component to display preloaded document
  const PreloadedDocumentDisplay = ({
    label,
    paths
  }: {
    label: string;
    paths: (string | undefined)[];
  }) => {
    const validPaths = paths.filter(Boolean) as string[];
    if (validPaths.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            From Quotation
          </span>
        </div>
        <div className="border rounded-lg p-3 bg-green-50/50 border-green-200">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              {validPaths.map((path, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {idx === 0 ? 'Front' : 'Back'}: {getFileNameFromPath(path)}
                  </p>
                </div>
              ))}
              <p className="text-xs text-green-600 mt-1">
                Document already uploaded during quotation process
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card data-testid="step-document-upload">
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload required identity and lease documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> All documents should be scanned copies of physical documents signed in-person.
              Ensure files are clear and readable.
            </AlertDescription>
          </Alert>

          {/* Emirates ID / National ID */}
          {hasPreloadedEmiratesId ? (
            <PreloadedDocumentDisplay
              label="Emirates ID / National ID"
              paths={[preloadedDocuments?.emiratesIdFrontPath, preloadedDocuments?.emiratesIdBackPath]}
            />
          ) : (
            <FileUploadZone
              label="Emirates ID / National ID"
              description="PDF, JPG, or PNG (max 5MB)"
              selectedFile={emiratesIdFile}
              onFileSelect={setEmiratesIdFile}
              required
              testId="upload-emirates-id"
            />
          )}

          {/* Passport */}
          {hasPreloadedPassport ? (
            <PreloadedDocumentDisplay
              label="Passport Copy"
              paths={[preloadedDocuments?.passportFrontPath, preloadedDocuments?.passportBackPath]}
            />
          ) : (
            <FileUploadZone
              label="Passport Copy"
              description="PDF, JPG, or PNG (max 5MB)"
              selectedFile={passportFile}
              onFileSelect={setPassportFile}
              required
              testId="upload-passport"
            />
          )}

          {/* Visa (Optional) */}
          <FileUploadZone
            label="Visa Copy (Optional)"
            description="PDF, JPG, or PNG (max 5MB)"
            selectedFile={visaFile}
            onFileSelect={setVisaFile}
            testId="upload-visa"
          />

          {/* Signed Lease Agreement */}
          <FileUploadZone
            label="Signed Lease Agreement"
            description="Scanned PDF of physically signed lease (max 10MB)"
            selectedFile={signedLeaseFile}
            onFileSelect={setSignedLeaseFile}
            maxSize={10 * 1024 * 1024}
            required
            testId="upload-signed-lease"
          />

          {/* Additional Documents */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Additional Documents (Optional)</p>
            <p className="text-xs text-muted-foreground mb-2">
              Upload up to 5 additional documents (salary certificate, bank statements, etc.)
            </p>

            {additionalFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md bg-accent/50"
                data-testid={`additional-file-${index}`}
              >
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdditionalFileRemove(index)}
                  data-testid={`btn-remove-additional-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {additionalFiles.length < 5 && (
              <FileUploadZone
                label=""
                description={`Add document (${additionalFiles.length}/5)`}
                selectedFile={null}
                onFileSelect={handleAdditionalFileAdd}
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
