'use client';

/**
 * Bank Account Form Modal Component
 * Story 6.5: Bank Account Management
 * AC #3: Add Bank Account Form with fields
 * AC #4: Edit Bank Account Form with pre-filled data
 * AC #26: Bank account form component with IBAN/SWIFT validation hints
 * Updated: shadcn-studio form styling (SCP-2025-11-30)
 */

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Building2,
  HelpCircle,
  Info,
  CheckCircle2,
  AlertCircle,
  HashIcon,
  LandmarkIcon,
  UserIcon,
} from 'lucide-react';
import type { BankAccount, BankAccountDetail } from '@/types/bank-account';
import { BankAccountStatus, UAE_BANKS } from '@/types/bank-account';
import {
  createBankAccountSchema,
  updateBankAccountSchema,
  type CreateBankAccountFormData,
  type UpdateBankAccountFormData,
  validateIbanFormat,
  validateSwiftFormat,
  getIbanValidationHints,
  getSwiftValidationHints,
} from '@/lib/validations/bank-account';
import { useCreateBankAccount, useUpdateBankAccount, useBankAccount } from '@/hooks/useBankAccounts';

interface BankAccountFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount: BankAccount | null;
  onSuccess: () => void;
  mode?: 'create' | 'edit' | 'view';
}

export function BankAccountFormModal({
  open,
  onOpenChange,
  bankAccount,
  onSuccess,
  mode = 'create',
}: BankAccountFormModalProps) {
  const isEditing = mode === 'edit';
  const isViewing = mode === 'view';

  // State for real-time validation feedback
  const [ibanValidation, setIbanValidation] = useState<{ valid: boolean; error?: string } | null>(null);
  const [swiftValidation, setSwiftValidation] = useState<{ valid: boolean; error?: string } | null>(null);

  // Fetch full account details when editing or viewing (to get decrypted values for admin)
  const { data: accountDetail, isLoading: isLoadingDetail } = useBankAccount(
    bankAccount?.id || '',
    (isEditing || isViewing) && open
  );

  // Mutations
  const { mutate: createAccount, isPending: isCreating } = useCreateBankAccount({
    onSuccess: () => onSuccess(),
  });
  const { mutate: updateAccount, isPending: isUpdating } = useUpdateBankAccount({
    onSuccess: () => onSuccess(),
  });
  const isSubmitting = isCreating || isUpdating;

  // Use a common form data type that works for both create and update
  type BankAccountFormData = {
    bankName: string;
    accountName: string;
    accountNumber: string;
    iban: string;
    swiftCode: string;
    isPrimary: boolean;
    status: BankAccountStatus;
  };

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(isEditing ? updateBankAccountSchema : createBankAccountSchema) as Resolver<BankAccountFormData>,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      iban: '',
      swiftCode: '',
      isPrimary: false,
      status: BankAccountStatus.ACTIVE,
    },
  });

  // Reset form when modal opens/closes or bankAccount changes
  useEffect(() => {
    if (open) {
      if ((isEditing || isViewing) && accountDetail) {
        form.reset({
          bankName: accountDetail.bankName,
          accountName: accountDetail.accountName,
          accountNumber: accountDetail.accountNumber || '',
          iban: accountDetail.iban || '',
          swiftCode: accountDetail.swiftCode,
          isPrimary: accountDetail.isPrimary,
          status: accountDetail.status,
        });
      } else if (!isEditing && !isViewing) {
        form.reset({
          bankName: '',
          accountName: '',
          accountNumber: '',
          iban: '',
          swiftCode: '',
          isPrimary: false,
          status: BankAccountStatus.ACTIVE,
        });
      }
      // Reset validation states
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIbanValidation(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSwiftValidation(null);
    }
  }, [open, isEditing, accountDetail, form]);

  // Real-time IBAN validation
  const handleIbanChange = (value: string) => {
    form.setValue('iban', value);
    if (value.length > 0) {
      setIbanValidation(validateIbanFormat(value));
    } else {
      setIbanValidation(null);
    }
  };

  // Real-time SWIFT validation
  const handleSwiftChange = (value: string) => {
    form.setValue('swiftCode', value);
    if (value.length > 0) {
      setSwiftValidation(validateSwiftFormat(value));
    } else {
      setSwiftValidation(null);
    }
  };

  const handleSubmit = (data: BankAccountFormData) => {
    if (isEditing && bankAccount) {
      updateAccount({
        id: bankAccount.id,
        data: data as UpdateBankAccountFormData,
      });
    } else {
      createAccount(data as CreateBankAccountFormData);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  const ibanHints = getIbanValidationHints();
  const swiftHints = getSwiftValidationHints();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="bank-account-form-description"
        data-testid="dialog-bank-account-form"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {isViewing ? 'View Bank Account' : isEditing ? 'Edit Bank Account' : 'Add Bank Account'}
          </DialogTitle>
          <DialogDescription id="bank-account-form-description">
            {isViewing
              ? `Viewing details for "${bankAccount?.bankName}"`
              : isEditing
              ? `Update bank account "${bankAccount?.bankName}"`
              : 'Add a new company bank account for PDC deposits'}
          </DialogDescription>
        </DialogHeader>

        {(isEditing || isViewing) && isLoadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="form-bank-account">
              {/* Bank Name */}
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="bankName" className="flex items-center gap-1">
                      Bank Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LandmarkIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="bankName"
                          className="pl-9"
                          placeholder="Select or type bank name"
                          {...field}
                          disabled={isSubmitting || isViewing}
                          list="uae-banks-list"
                          data-testid="input-bank-name"
                        />
                      </FormControl>
                      <datalist id="uae-banks-list">
                        {UAE_BANKS.map((bank) => (
                          <option key={bank} value={bank} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Select from common UAE banks or enter a custom name
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Name */}
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="accountName" className="flex items-center gap-1">
                      Account Name <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="accountName"
                          className="pl-9"
                          placeholder="e.g., Company Main Account"
                          {...field}
                          disabled={isSubmitting || isViewing}
                          data-testid="input-account-name"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Account holder name or description
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Number */}
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <Label htmlFor="accountNumber" className="flex items-center gap-1">
                      Account Number <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <HashIcon className="size-4" />
                      </div>
                      <FormControl>
                        <Input
                          id="accountNumber"
                          className="pl-9"
                          placeholder="e.g., 1234567890123456"
                          {...field}
                          disabled={isSubmitting || isViewing}
                          data-testid="input-account-number"
                        />
                      </FormControl>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Bank account number (encrypted at rest)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* IBAN with validation hints */}
              <FormField
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="iban" className="flex items-center gap-1">
                        IBAN <span className="text-destructive">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <ul className="text-sm space-y-1">
                              {ibanHints.map((hint, i) => (
                                <li key={i}>{hint}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building2 className="size-4" />
                        </div>
                        <Input
                          id="iban"
                          className={`pl-9 pr-10 ${ibanValidation ? (ibanValidation.valid ? 'border-green-500' : 'border-destructive') : ''}`}
                          placeholder="AE070331234567890123456"
                          {...field}
                          onChange={(e) => handleIbanChange(e.target.value)}
                          disabled={isSubmitting || isViewing}
                          data-testid="input-iban"
                        />
                        {ibanValidation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {ibanValidation.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      UAE IBAN: AE + 21 digits (encrypted at rest)
                    </p>
                    {ibanValidation && !ibanValidation.valid && (
                      <p className="text-sm text-destructive">{ibanValidation.error}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SWIFT/BIC with validation hints */}
              <FormField
                control={form.control}
                name="swiftCode"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="swiftCode" className="flex items-center gap-1">
                        SWIFT/BIC Code <span className="text-destructive">*</span>
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <ul className="text-sm space-y-1">
                              {swiftHints.map((hint, i) => (
                                <li key={i}>{hint}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building2 className="size-4" />
                        </div>
                        <Input
                          id="swiftCode"
                          className={`pl-9 pr-10 ${swiftValidation ? (swiftValidation.valid ? 'border-green-500' : 'border-destructive') : ''}`}
                          placeholder="EMIRAEADXXX"
                          {...field}
                          onChange={(e) => handleSwiftChange(e.target.value)}
                          disabled={isSubmitting || isViewing}
                          data-testid="input-swift-code"
                        />
                        {swiftValidation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {swiftValidation.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <p className="text-muted-foreground text-xs">
                      8 or 11 character bank identifier code
                    </p>
                    {swiftValidation && !swiftValidation.valid && (
                      <p className="text-sm text-destructive">{swiftValidation.error}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Primary Account Toggle */}
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label>Primary Account</Label>
                      <p className="text-muted-foreground text-xs">
                        Set as the default bank account for new PDCs
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        data-testid="switch-is-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Status (only for edit mode) */}
              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-status" className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={BankAccountStatus.ACTIVE}>
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="size-4 text-green-600" />
                              <span>Active</span>
                            </div>
                          </SelectItem>
                          <SelectItem value={BankAccountStatus.INACTIVE}>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="size-4 text-gray-500" />
                              <span>Inactive</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-muted-foreground text-xs">
                        Inactive accounts cannot be used for new PDCs
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Security Notice */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Account numbers and IBANs are encrypted using AES-256 encryption before
                  being stored in the database.
                </AlertDescription>
              </Alert>

              <DialogFooter className="pt-4">
                {isViewing ? (
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} data-testid="btn-submit-form">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isEditing ? 'Updating...' : 'Creating...'}
                        </>
                      ) : isEditing ? (
                        'Update Bank Account'
                      ) : (
                        'Add Bank Account'
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
