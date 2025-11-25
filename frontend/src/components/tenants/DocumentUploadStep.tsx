'use client';

/**
 * Step 6: Document Upload
 * Upload required and optional documents
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';

import { FileUploadZone } from './FileUploadZone';
import { documentUploadSchema } from '@/lib/validations/tenant';
import type { TenantDocumentUploadFormData } from '@/types/tenant';

interface DocumentUploadStepProps {
  data: TenantDocumentUploadFormData;
  onComplete: (data: TenantDocumentUploadFormData) => void;
  onBack: () => void;
}

export function DocumentUploadStep({ data, onComplete, onBack }: DocumentUploadStepProps) {
  const [emiratesIdFile, setEmiratesIdFile] = useState<File | null>(data.emiratesIdFile);
  const [passportFile, setPassportFile] = useState<File | null>(data.passportFile);
  const [visaFile, setVisaFile] = useState<File | null>(data.visaFile ?? null);
  const [signedLeaseFile, setSignedLeaseFile] = useState<File | null>(data.signedLeaseFile);
  const [additionalFiles, setAdditionalFiles] = useState<File[]>(data.additionalFiles || []);

  const form = useForm<TenantDocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: data,
  });

  const onSubmit = () => {
    // Validate manually since we're using custom file inputs
    const hasEmiratesId = emiratesIdFile !== null;
    const hasPassport = passportFile !== null;
    const hasSignedLease = signedLeaseFile !== null;

    if (!hasEmiratesId || !hasPassport || !hasSignedLease) {
      form.setError('emiratesIdFile', {
        message: !hasEmiratesId ? 'Emirates ID is required' : undefined!,
      });
      form.setError('passportFile', {
        message: !hasPassport ? 'Passport is required' : undefined!,
      });
      form.setError('signedLeaseFile', {
        message: !hasSignedLease ? 'Signed lease agreement is required' : undefined!,
      });
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
          <FileUploadZone
            label="Emirates ID / National ID"
            description="PDF, JPG, or PNG (max 5MB)"
            selectedFile={emiratesIdFile}
            onFileSelect={setEmiratesIdFile}
            required
            testId="upload-emirates-id"
          />

          {/* Passport */}
          <FileUploadZone
            label="Passport Copy"
            description="PDF, JPG, or PNG (max 5MB)"
            selectedFile={passportFile}
            onFileSelect={setPassportFile}
            required
            testId="upload-passport"
          />

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
