'use client';

/**
 * Step 3: Financial Info & Cheque Upload
 * SCP-2025-12-10: New step replacing the old Step 3 (Rent Breakdown)
 *
 * Features:
 * - Display company bank account information (read-only)
 * - Upload cheque images
 * - AWS Textract OCR processing
 * - Editable extracted cheque details
 * - Summary of expected vs uploaded cheques
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  AlertCircle,
  Building2,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Trash2,
  Edit3,
  RefreshCw,
  Banknote,
  CreditCard,
} from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadProgress } from '@/components/ui/file-upload-progress';
import { useBankAccountsDropdown } from '@/hooks/useBankAccounts';
import {
  processChequeImages,
  type ChequeDetail,
  ChequeProcessingStatus,
  OverallStatus,
} from '@/services/textract.service';
import type { BankAccountDropdownItem } from '@/types/bank-account';

// ===========================
// Types
// ===========================

export interface FinancialInfoFormData {
  chequeDetails: EditableChequeDetail[];
  bankAccountId?: string;
  bankAccountName?: string;
  bankName?: string;
}

export interface EditableChequeDetail extends ChequeDetail {
  isEditing?: boolean;
  file?: File;
}

interface FinancialInfoStepProps {
  data: FinancialInfoFormData;
  onComplete: (data: FinancialInfoFormData) => void;
  onBack: (data?: FinancialInfoFormData) => void;
  quotationId: string;
  expectedChequeCount: number;
  firstMonthPaymentMethod?: 'CASH' | 'CHEQUE';
}

// ===========================
// Component
// ===========================

export function FinancialInfoStep({
  data,
  onComplete,
  onBack,
  quotationId,
  expectedChequeCount,
  firstMonthPaymentMethod,
}: FinancialInfoStepProps) {
  // Story 3.9: Bank account selection
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | undefined>(
    data.bankAccountId
  );
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useBankAccountsDropdown();

  // Find selected bank account
  const selectedBankAccount = bankAccounts?.find(
    (account) => account.id === selectedBankAccountId
  );

  // Cheque upload state
  const [chequeFiles, setChequeFiles] = useState<File[]>([]);
  const [chequeDetails, setChequeDetails] = useState<EditableChequeDetail[]>(
    data.chequeDetails || []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // SCP-2025-12-12: expectedChequeCount already comes from backend's numberOfCheques
  // which is already adjusted for CASH first payment (numberOfPayments - 1)
  // No need to subtract again here
  const adjustedExpectedCount = expectedChequeCount;

  // Handle single file selection (backward compatible)
  const handleFileAdd = useCallback((file: File | null) => {
    if (file && chequeFiles.length < 12) {
      setChequeFiles((prev) => [...prev, file]);
    }
  }, [chequeFiles.length]);

  // Handle multiple file selection
  const handleFilesAdd = useCallback((files: File[]) => {
    const remainingSlots = 12 - chequeFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    if (filesToAdd.length > 0) {
      setChequeFiles((prev) => [...prev, ...filesToAdd]);
    }
  }, [chequeFiles.length]);

  // Handle file removal
  const handleFileRemove = (index: number) => {
    setChequeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Process cheques with Textract
  const handleProcessCheques = async () => {
    if (chequeFiles.length === 0) {
      toast.error('Please upload at least one cheque image');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(10);

    try {
      // Simulate progress during processing
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await processChequeImages(chequeFiles, quotationId);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Map results to editable details
      const editableDetails: EditableChequeDetail[] = result.cheques.map((cheque, index) => ({
        ...cheque,
        file: chequeFiles[index],
        isEditing: false,
      }));

      setChequeDetails(editableDetails);

      // Show appropriate toast based on status
      switch (result.overallStatus) {
        case OverallStatus.SUCCESS:
          toast.success('All cheques processed successfully');
          break;
        case OverallStatus.PARTIAL_SUCCESS:
          toast.warning(result.validationMessage);
          break;
        case OverallStatus.VALIDATION_ERROR:
          toast.error(result.validationMessage);
          break;
        case OverallStatus.PROCESSING_ERROR:
          toast.error('Failed to process cheques. Please try again.');
          break;
      }
    } catch (error: unknown) {
      console.error('Failed to process cheques:', error);

      // Extract error message from API response
      let errorMessage = 'Failed to process cheques. Please try again.';

      // Handle Axios error with response data
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { data?: { validationMessage?: string }; message?: string } } };
        const responseData = axiosError.response?.data;

        // Try to get validation message from ProcessChequesResponse
        if (responseData?.data?.validationMessage) {
          errorMessage = responseData.data.validationMessage;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Toggle edit mode for a cheque
  const handleToggleEdit = (index: number) => {
    setChequeDetails((prev) =>
      prev.map((cheque, i) =>
        i === index ? { ...cheque, isEditing: !cheque.isEditing } : cheque
      )
    );
  };

  // Update cheque detail
  const handleUpdateCheque = (
    index: number,
    field: keyof EditableChequeDetail,
    value: string | number | Date | null
  ) => {
    setChequeDetails((prev) =>
      prev.map((cheque, i) =>
        i === index ? { ...cheque, [field]: value } : cheque
      )
    );
  };

  // Remove a processed cheque
  const handleRemoveCheque = (index: number) => {
    setChequeDetails((prev) => prev.filter((_, i) => i !== index));
    setChequeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate and submit
  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    // Check if bank account is selected (mandatory)
    if (!selectedBankAccountId) {
      newErrors.bankAccount = 'Please select a Pay To account';
    }

    // Check if we have the expected number of cheques
    if (chequeDetails.length < adjustedExpectedCount) {
      newErrors.chequeCount = `Expected ${adjustedExpectedCount} cheques, but only ${chequeDetails.length} uploaded`;
    }

    // Validate each cheque has required fields
    chequeDetails.forEach((cheque, index) => {
      if (!cheque.chequeNumber) {
        newErrors[`cheque_${index}_number`] = `Cheque ${index + 1}: Cheque number is required`;
      }
      if (!cheque.amount || cheque.amount <= 0) {
        newErrors[`cheque_${index}_amount`] = `Cheque ${index + 1}: Amount is required`;
      }
      if (!cheque.chequeDate) {
        newErrors[`cheque_${index}_date`] = `Cheque ${index + 1}: Date is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    setErrors({});
    onComplete({
      chequeDetails,
      bankAccountId: selectedBankAccount?.id,
      bankAccountName: selectedBankAccount?.accountName,
      bankName: selectedBankAccount?.bankName,
    });
  };

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'AED 0';
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge for cheque
  const getStatusBadge = (status: ChequeProcessingStatus) => {
    switch (status) {
      case ChequeProcessingStatus.SUCCESS:
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Extracted
          </Badge>
        );
      case ChequeProcessingStatus.PARTIAL:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        );
      case ChequeProcessingStatus.FAILED:
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  // Calculate totals
  const totalChequeAmount = chequeDetails.reduce(
    (sum, cheque) => sum + (cheque.amount || 0),
    0
  );

  return (
    <Card data-testid="step-financial-info">
      <CardHeader>
        <CardTitle>Financial Information & Cheque Upload</CardTitle>
        <CardDescription>
          Upload post-dated cheques for rent payments. Our OCR system will automatically extract cheque details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Bank Account Selection - Story 3.9 */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Pay To Account</h3>
                <p className="text-sm text-muted-foreground">
                  Select the bank account for rent payment instructions
                </p>
              </div>
            </div>

            {loadingBankAccounts ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : bankAccounts && bankAccounts.length > 0 ? (
              <div className="space-y-6">
                {/* Bank Account Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="bank-account-select">
                    Select Bank Account
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Select
                    value={selectedBankAccountId}
                    onValueChange={setSelectedBankAccountId}
                  >
                    <SelectTrigger id="bank-account-select" data-testid="bank-account-select">
                      <SelectValue placeholder="Select a bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.bankName}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="font-mono text-sm">{account.accountNumberMasked}</span>
                            {account.isPrimary && (
                              <Badge
                                variant="secondary"
                                className="ml-2 bg-primary/10 text-primary text-xs"
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This account will be shown on invoices for rent payment instructions
                  </p>
                  {errors.bankAccount && (
                    <p className="text-xs text-destructive mt-1">{errors.bankAccount}</p>
                  )}
                </div>

                {/* Selected Bank Account Details */}
                {selectedBankAccount && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-4">Selected Account Details</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">Bank Name</Label>
                          <p className="font-medium">{selectedBankAccount.bankName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Account Name</Label>
                          <p className="font-medium">{selectedBankAccount.accountName}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Account Number</Label>
                          <p className="font-medium font-mono">
                            {selectedBankAccount.accountNumberMasked}
                          </p>
                        </div>
                        {selectedBankAccount.isPrimary && (
                          <div className="flex items-center">
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Primary Account
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No bank accounts configured. Please configure a bank account in Settings before creating a tenant.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Cheque Requirements Info - Premium Design */}
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/[0.03] via-background to-primary/[0.05]">
            {/* Decorative background elements */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-primary/5 blur-xl" />

            <div className="relative p-5">
              <div className="flex items-start gap-4">
                {/* Icon with animated ring */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 animate-[spin_8s_linear_infinite] rounded-2xl border border-dashed border-primary/30" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Header */}
                  <div>
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      Cheque Requirements
                      {firstMonthPaymentMethod === 'CASH' && (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
                          First payment is Cash
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Based on the quotation payment schedule
                    </p>
                  </div>

                  {/* Cheque count visual */}
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {Array.from({ length: Math.min(adjustedExpectedCount, 5) }).map((_, i) => (
                        <div
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border-2 border-background text-xs font-bold text-primary"
                        >
                          {i + 1}
                        </div>
                      ))}
                      {adjustedExpectedCount > 5 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted border-2 border-background text-xs font-medium text-muted-foreground">
                          +{adjustedExpectedCount - 5}
                        </div>
                      )}
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div>
                      <span className="text-2xl font-bold text-primary">{adjustedExpectedCount}</span>
                      <span className="text-sm text-muted-foreground ml-1.5">
                        post-dated {adjustedExpectedCount === 1 ? 'cheque' : 'cheques'} required
                      </span>
                    </div>
                  </div>

                  {/* File format info */}
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>JPEG, PNG</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Max 5MB per file</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cheque Upload Section */}
          <div className="rounded-2xl border border-muted bg-muted/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Cheque Images</h3>
                  <p className="text-sm text-muted-foreground">
                    {chequeFiles.length} of {adjustedExpectedCount} cheques uploaded
                  </p>
                </div>
              </div>
              {chequeFiles.length > 0 && !isProcessing && chequeDetails.length === 0 && (
                <Button onClick={handleProcessCheques} data-testid="btn-process-cheques">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Process with OCR
                </Button>
              )}
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Processing cheques with AWS Textract...
                  </span>
                </div>
                <Progress value={processingProgress} className="h-2" />
              </div>
            )}

            {/* File List */}
            {chequeFiles.length > 0 && chequeDetails.length === 0 && (
              <div className="space-y-2 mb-4">
                {chequeFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-xl bg-background"
                    data-testid={`cheque-file-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Banknote className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {file.name}
                        </p>
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
                      onClick={() => handleFileRemove(index)}
                      disabled={isProcessing}
                      data-testid={`btn-remove-file-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Zone - Multiple file selection enabled */}
            {chequeFiles.length < 12 && chequeDetails.length === 0 && (
              <FileUploadProgress
                onFilesSelect={handleFilesAdd}
                multiple={true}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                maxSize={5 * 1024 * 1024}
                label={`Add Cheque Images (${chequeFiles.length}/${adjustedExpectedCount}) - Select multiple files`}
                testId="upload-cheque"
                disabled={isProcessing}
              />
            )}
          </div>

          {/* Processed Cheques Table */}
          {chequeDetails.length > 0 && (
            <div className="rounded-2xl border border-muted bg-muted/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Extracted Cheque Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Review and edit extracted information as needed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(totalChequeAmount)}
                  </p>
                </div>
              </div>

              {/* Validation Errors Summary */}
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please fix the following errors:
                    <ul className="list-disc list-inside mt-2">
                      {Object.values(errors).map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Cheque No.</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chequeDetails.map((cheque, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          {cheque.isEditing ? (
                            <Input
                              value={cheque.bankName || ''}
                              onChange={(e) =>
                                handleUpdateCheque(index, 'bankName', e.target.value)
                              }
                              className="h-8 w-32"
                              placeholder="Bank name"
                            />
                          ) : (
                            cheque.bankName || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {cheque.isEditing ? (
                            <Input
                              value={cheque.chequeNumber || ''}
                              onChange={(e) =>
                                handleUpdateCheque(index, 'chequeNumber', e.target.value)
                              }
                              className="h-8 w-28"
                              placeholder="Cheque #"
                            />
                          ) : (
                            <span className="font-mono">
                              {cheque.chequeNumber || '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cheque.isEditing ? (
                            <Input
                              type="number"
                              value={cheque.amount || ''}
                              onChange={(e) =>
                                handleUpdateCheque(
                                  index,
                                  'amount',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-8 w-28"
                              placeholder="Amount"
                            />
                          ) : (
                            <span className="font-medium">
                              {formatCurrency(cheque.amount)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cheque.isEditing ? (
                            <DatePickerInput
                              value={
                                cheque.chequeDate
                                  ? new Date(cheque.chequeDate)
                                  : undefined
                              }
                              onChange={(date) =>
                                handleUpdateCheque(
                                  index,
                                  'chequeDate',
                                  date?.toISOString() || null
                                )
                              }
                              className="h-8 w-32"
                            />
                          ) : cheque.chequeDate ? (
                            format(new Date(cheque.chequeDate), 'dd/MM/yyyy')
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(cheque.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleEdit(index)}
                              data-testid={`btn-edit-cheque-${index}`}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveCheque(index)}
                              data-testid={`btn-remove-cheque-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Add More Cheques Button */}
              {chequeDetails.length < adjustedExpectedCount && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setChequeDetails([]);
                      setChequeFiles([]);
                    }}
                    className="w-full"
                    data-testid="btn-add-more-cheques"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload More Cheques ({chequeDetails.length}/{adjustedExpectedCount})
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {chequeDetails.length > 0 && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Cheque Summary</p>
                  <p className="text-xs text-muted-foreground">
                    {chequeDetails.length} of {adjustedExpectedCount} cheques uploaded
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(totalChequeAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total cheque value</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onBack({
                  chequeDetails,
                  bankAccountId: selectedBankAccount?.id,
                  bankAccountName: selectedBankAccount?.accountName,
                  bankName: selectedBankAccount?.bankName,
                })
              }
              data-testid="btn-back"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={chequeDetails.length === 0}
              data-testid="btn-next"
            >
              Next: Documents
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
