'use client';

/**
 * Cheque Breakdown Section Component
 * SCP-2025-12-06: Payment breakdown with auto-split across cheques
 * SCP-2025-12-08: Lease-type aware parking fee handling:
 *   - YEARLY: Parking is one-time annual fee (included in first payment)
 *   - MONTH_TO_MONTH/FIXED_TERM: Parking added to each monthly payment
 *
 * Features:
 * - Yearly rent amount input
 * - Number of cheques selection (1-12)
 * - First month payment method (Cash/Cheque)
 * - Editable first month total payment (includes one-time fees)
 * - Auto-adjusted remaining cheques when first payment is overridden
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Banknote,
  Car,
  CreditCard,
  Calculator,
  FileSpreadsheet,
  Edit3,
  RotateCcw,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FirstMonthPaymentMethod, type ChequeBreakdownItem } from '@/types/quotations';
import { addMonths, format } from 'date-fns';
import { LeaseType } from '@/types/tenant';

interface ChequeBreakdownSectionProps {
  yearlyRentAmount: number;
  numberOfCheques: number;
  firstMonthPaymentMethod: FirstMonthPaymentMethod;
  leaseStartDate: Date;
  chequeBreakdown: ChequeBreakdownItem[];
  // SCP-2025-12-07: Payment due date (day of month, 1-31) - defaults to 5
  paymentDueDate?: number;
  onPaymentDueDateChange?: (value: number) => void;
  // One-time fees
  securityDeposit: number;
  adminFee: number;
  serviceCharges: number;
  parkingFee: number;
  // SCP-2025-12-08: Lease type determines parking fee treatment
  // YEARLY: parking is one-time annual (included in oneTimeFees)
  // MONTH_TO_MONTH/FIXED_TERM: parking is monthly (added to each payment)
  leaseType?: LeaseType;
  // Callbacks
  onYearlyRentAmountChange: (value: number) => void;
  onNumberOfChequesChange: (value: number) => void;
  onFirstMonthPaymentMethodChange: (value: FirstMonthPaymentMethod) => void;
  onChequeBreakdownChange: (breakdown: ChequeBreakdownItem[]) => void;
  onFirstMonthTotalChange?: (value: number) => void;
  className?: string;
}

const formatCurrencyLocal = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // No decimals - whole numbers only
  }).format(amount);
};

export function ChequeBreakdownSection({
  yearlyRentAmount,
  numberOfCheques,
  firstMonthPaymentMethod,
  leaseStartDate,
  chequeBreakdown,
  paymentDueDate = 5, // SCP-2025-12-07: Default to 5th of month
  onPaymentDueDateChange,
  securityDeposit,
  adminFee,
  serviceCharges,
  parkingFee,
  leaseType, // SCP-2025-12-08: Lease type for parking fee treatment
  onYearlyRentAmountChange,
  onNumberOfChequesChange,
  onFirstMonthPaymentMethodChange,
  onChequeBreakdownChange,
  onFirstMonthTotalChange,
  className,
}: ChequeBreakdownSectionProps) {
  // Determine if this is an annual lease (for display purposes)
  const isAnnualLease = leaseType === 'YEARLY';

  // Track if first month payment has been manually overridden
  const [isFirstMonthOverridden, setIsFirstMonthOverridden] = useState(false);
  const [customFirstMonthTotal, setCustomFirstMonthTotal] = useState(0);

  // SCP-2025-12-10: One-time fees WITHOUT parking (for subtotal display)
  const oneTimeFeesWithoutParking = useMemo(() => {
    return securityDeposit + adminFee + serviceCharges;
  }, [securityDeposit, adminFee, serviceCharges]);

  // Calculate one-time fees total (including parking for total calculations)
  // Parking fee is ALWAYS annual (one-time) - included in first payment only
  const oneTimeFees = useMemo(() => {
    return oneTimeFeesWithoutParking + parkingFee;
  }, [oneTimeFeesWithoutParking, parkingFee]);

  // Parking is always annual - never added to recurring payments
  const monthlyParkingFee = 0;

  // numberOfCheques represents number of PAYMENTS (rent is split across these)
  // The first payment always includes fees + first rent portion
  //
  // Example with numberOfPayments = 6 and yearly rent = 12000:
  // - Each rent payment = 12000 / 6 = 2000
  // - First payment = 2000 (rent) + fees
  // - Payments #2-6 = 2000 each (rent only)
  // - Total = 6 payments

  // Calculate each rent payment amount (yearly / number of payments)
  const defaultRentPerPayment = useMemo(() => {
    if (yearlyRentAmount <= 0 || numberOfCheques <= 0) return 0;
    return yearlyRentAmount / numberOfCheques;
  }, [yearlyRentAmount, numberOfCheques]);

  // Calculate default first month total (one-time fees + first rent payment)
  const defaultFirstMonthTotal = useMemo(() => {
    return oneTimeFees + defaultRentPerPayment;
  }, [oneTimeFees, defaultRentPerPayment]);

  // Current first month total (custom or default)
  const currentFirstMonthTotal = isFirstMonthOverridden ? customFirstMonthTotal : defaultFirstMonthTotal;

  // Calculate the first payment rent portion from the total
  const firstRentPortion = useMemo(() => {
    return Math.max(0, currentFirstMonthTotal - oneTimeFees);
  }, [currentFirstMonthTotal, oneTimeFees]);

  // Calculate remaining amount to distribute across other cheques (cheques #2 to #numberOfCheques)
  const remainingRentAmount = useMemo(() => {
    return Math.max(0, yearlyRentAmount - firstRentPortion);
  }, [yearlyRentAmount, firstRentPortion]);

  // Number of remaining cheques after first payment
  const remainingChequeCount = numberOfCheques - 1;

  // Helper function to set the day of month for a date, handling month boundaries
  const setDayOfMonth = (date: Date, day: number): Date => {
    const result = new Date(date);
    const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    // If the desired day exceeds the month's days, use the last day of the month
    result.setDate(Math.min(day, lastDayOfMonth));
    return result;
  };

  // Calculate cheque breakdown with adjusted amounts (whole numbers only)
  // SCP-2025-12-07: First payment = today, subsequent payments use paymentDueDate
  // SCP-2025-12-08: For non-annual leases, add monthly parking to each payment
  useEffect(() => {
    if (yearlyRentAmount > 0 && numberOfCheques > 0) {
      const breakdown: ChequeBreakdownItem[] = [];

      // First payment rent portion (rounded to whole number)
      const firstRentPortionRounded = Math.round(firstRentPortion);

      // First payment due date is TODAY (use local date to avoid timezone issues)
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // First payment (includes fees + first rent portion)
      // For CHEQUE: This is cheque #1 with fees
      // For CASH: This is cash payment with fees (shown as payment #1)
      // Note: Parking fee is included in oneTimeFees, not added separately here
      breakdown.push({
        chequeNumber: 1,
        amount: firstRentPortionRounded, // Rent only (parking is in oneTimeFees)
        dueDate: todayStr,
      });

      // Remaining payments (rent only) - calculate interval based on number of payments
      // SCP-2025-12-10: Payment interval calculation:
      // 1 payment = annual (no subsequent), 2 = every 6 months, 3 = every 4 months,
      // 4 = every 3 months (quarterly), 6 = every 2 months (bi-monthly)
      if (remainingChequeCount > 0) {
        // Calculate remaining rent after first payment (using rounded first portion)
        const actualRemainingRent = yearlyRentAmount - firstRentPortionRounded;

        // Use floor for base amount to ensure we don't exceed total
        const baseAmount = Math.floor(actualRemainingRent / remainingChequeCount);

        // Calculate how many payments need an extra 1 to make up the difference
        const remainder = actualRemainingRent - (baseAmount * remainingChequeCount);

        // Calculate month interval: 12 months / numberOfCheques
        const monthInterval = Math.floor(12 / numberOfCheques);

        for (let i = 0; i < remainingChequeCount; i++) {
          // Add months based on interval (e.g., 6 payments = every 2 months)
          const monthsToAdd = (i + 1) * monthInterval;
          const nextDate = addMonths(today, monthsToAdd);
          const dueDate = setDayOfMonth(nextDate, paymentDueDate);
          // Add +1 to the first 'remainder' payments to distribute the difference evenly
          const rentAmount = i < remainder ? baseAmount + 1 : baseAmount;

          breakdown.push({
            chequeNumber: i + 2, // Start from #2
            amount: rentAmount,
            dueDate: dueDate.toISOString().split('T')[0],
          });
        }
      }

      onChequeBreakdownChange(breakdown);
    }
  }, [yearlyRentAmount, numberOfCheques, leaseStartDate, paymentDueDate, firstRentPortion, remainingRentAmount, remainingChequeCount, oneTimeFees, onChequeBreakdownChange]);

  // Reset custom first month when inputs change (unless manually set)
  useEffect(() => {
    if (!isFirstMonthOverridden) {
      setCustomFirstMonthTotal(defaultFirstMonthTotal);
    }
  }, [defaultFirstMonthTotal, isFirstMonthOverridden]);

  // Notify parent of first month total changes
  useEffect(() => {
    onFirstMonthTotalChange?.(currentFirstMonthTotal);
  }, [currentFirstMonthTotal, onFirstMonthTotalChange]);

  const handleFirstMonthTotalChange = (value: number) => {
    // SCP-2025-12-10: Allow any value to be entered - validation will block navigation
    // if value is below minimum (handled in page's validateStep)
    const minValue = Math.round(defaultFirstMonthTotal);
    setCustomFirstMonthTotal(value);
    setIsFirstMonthOverridden(value !== minValue);
  };

  const handleResetFirstMonth = () => {
    setIsFirstMonthOverridden(false);
    setCustomFirstMonthTotal(defaultFirstMonthTotal);
  };

  // Number of payments options: 1, 2, 3, 4, 6 only
  const paymentOptions = [1, 2, 3, 4, 6];

  // Calculate the difference from default
  const adjustmentAmount = currentFirstMonthTotal - defaultFirstMonthTotal;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Payment Breakdown</h3>
          <p className="text-sm text-muted-foreground">
            Configure yearly rent and cheque schedule
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-muted bg-muted/20 p-6">
        {/* Yearly Rent Amount */}
        <div className="mb-6">
          <Label className="text-muted-foreground mb-2 block">
            Yearly Rent Amount
          </Label>
          <CurrencyInput
            min={0}
            value={yearlyRentAmount}
            onChange={onYearlyRentAmountChange}
            className="h-12 rounded-xl border-2 text-lg"
            data-testid="input-yearly-rent"
          />
        </div>

        {/* Number of Payments & Payment Due Date - 2 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Number of Payments</Label>
            <Select
              value={numberOfCheques.toString()}
              onValueChange={(v) => onNumberOfChequesChange(parseInt(v))}
            >
              <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-payments">
                <SelectValue placeholder="Select payments" />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Payment' : 'Payments'}
                    {num === 6 && ' (Bi-monthly)'}
                    {num === 4 && ' (Quarterly)'}
                    {num === 2 && ' (Semi-annual)'}
                    {num === 1 && ' (Annual)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SCP-2025-12-07: Payment Due Date - for subsequent payments (first payment is always today) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Payment Due Date</Label>
            <Select
              value={paymentDueDate.toString()}
              onValueChange={(v) => onPaymentDueDateChange?.(parseInt(v))}
            >
              <SelectTrigger className="h-12 rounded-xl border-2" data-testid="select-due-date">
                <SelectValue placeholder="Select due date" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`} of each month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SCP-2025-12-07: First Payment Mode - moved to its own section */}
        <div className="mb-6">
          <Label className="text-muted-foreground mb-3 block">First Payment Mode</Label>
          <RadioGroup
            value={firstMonthPaymentMethod}
            onValueChange={(v) => onFirstMonthPaymentMethodChange(v as FirstMonthPaymentMethod)}
            className="flex gap-4"
          >
            <label
              htmlFor="payment-cash"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value={FirstMonthPaymentMethod.CASH} id="payment-cash" className="shrink-0" />
              <Banknote className="h-5 w-5 text-green-600 shrink-0" />
              <span className="font-medium">Cash</span>
            </label>
            <label
              htmlFor="payment-cheque"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                firstMonthPaymentMethod === FirstMonthPaymentMethod.CHEQUE
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value={FirstMonthPaymentMethod.CHEQUE} id="payment-cheque" className="shrink-0" />
              <CreditCard className="h-5 w-5 text-blue-600 shrink-0" />
              <span className="font-medium">Cheque</span>
            </label>
          </RadioGroup>
        </div>

        <Separator className="my-6" />

        {/* First Month Total Payment - Editable (Always visible, required field) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Label className="text-foreground font-medium">First Month Total Payment *</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Includes one-time fees (Security Deposit, Admin Fee, Service Charges, Parking)
                      plus first rent payment. Adjust to redistribute across remaining payments.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {isFirstMonthOverridden && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Edit3 className="h-3 w-3" />
                  Custom
                </Badge>
              )}
            </div>
            {isFirstMonthOverridden && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFirstMonth}
                className="text-xs gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          <CurrencyInput
            min={0}
            value={currentFirstMonthTotal}
            onChange={handleFirstMonthTotalChange}
            className={cn(
              "h-12 rounded-xl border-2 text-lg",
              isFirstMonthOverridden && "border-amber-500 bg-amber-50/50"
            )}
            data-testid="input-first-month-total"
          />

          {/* Breakdown of first month */}
          {/* SCP-2025-12-10: Parking Fee moved after One-time Fees Subtotal */}
          <div className="mt-3 p-3 rounded-lg bg-muted/30 text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Security Deposit</span>
              <span>{formatCurrencyLocal(securityDeposit)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Admin Fee</span>
              <span>{formatCurrencyLocal(adminFee)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Service Charges</span>
              <span>{formatCurrencyLocal(serviceCharges)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-medium">
              <span>One-time Fees Subtotal</span>
              <span>{formatCurrencyLocal(oneTimeFeesWithoutParking)}</span>
            </div>
            {/* Parking is always annual - shown after subtotal */}
            {parkingFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Parking Fee (Annual)
                  <Car className="h-3.5 w-3.5" />
                </span>
                <span>{formatCurrencyLocal(parkingFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-primary font-medium">
              <span>First Rent Payment</span>
              <span>{formatCurrencyLocal(firstRentPortion)}</span>
            </div>
            {adjustmentAmount > 0 && (
              <div className="flex justify-between text-xs pt-1 text-amber-600">
                <span>Extra collected (reduces other payments)</span>
                <span>+{formatCurrencyLocal(adjustmentAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cheque Schedule Table */}
        {yearlyRentAmount > 0 && numberOfCheques > 0 && chequeBreakdown.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Payment Schedule</span>
                <Badge variant="secondary" className="text-xs">
                  {chequeBreakdown.length} Payments
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                <Calculator className="h-3 w-3 mr-1" />
                {isFirstMonthOverridden ? 'Adjusted' : 'Auto-Split'}
              </Badge>
            </div>

            <div className="rounded-xl border bg-card overflow-hidden">
              {/* Table Header - 4 columns: #, Due Date, Payment Mode, Amount */}
              <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                <div>#</div>
                <div>Due Date</div>
                <div>Payment Mode</div>
                <div className="text-right">Amount</div>
              </div>

              {/* Table Body */}
              {/* SCP-2025-12-08: Updated to show monthly parking in each payment for non-annual leases */}
              <div>
                {chequeBreakdown.map((item, index) => {
                  // First payment shows rent + fees, others show just rent
                  // Note: item.amount already includes monthly parking for non-annual leases
                  const displayAmount = index === 0 ? item.amount + oneTimeFees : item.amount;
                  // Format the due date
                  const formattedDueDate = item.dueDate ? format(new Date(item.dueDate), 'dd MMM yyyy') : '-';

                  return (
                    <div
                      key={item.chequeNumber}
                      className={cn(
                        'grid grid-cols-4 gap-4 p-3 hover:bg-muted/30 transition-colors',
                        index !== chequeBreakdown.length - 1 && 'border-b border-muted/50',
                        index === 0 && isFirstMonthOverridden && 'bg-amber-50/30'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.chequeNumber}</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            + Fees
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm tabular-nums">
                          {formattedDueDate}
                        </span>
                        {index === 0 && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-green-600 border-green-200">
                            Today
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 && firstMonthPaymentMethod === FirstMonthPaymentMethod.CASH ? (
                          <>
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Cash</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">Cheque</span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrencyLocal(displayAmount)}
                        </span>
                        {index === 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            ({formatCurrencyLocal(item.amount)} rent + fees)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Footer - Totals */}
              <div className="bg-primary/5 border-t">
                <div className="grid grid-cols-4 gap-4 p-3 font-medium">
                  <div className="col-span-3 text-sm">Total Rent (Yearly)</div>
                  <div className="text-right text-sm tabular-nums text-primary">
                    {formatCurrencyLocal(yearlyRentAmount)}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 px-3 pb-3 text-muted-foreground">
                  <div className="col-span-3 text-xs">+ One-time Fees (incl. Parking)</div>
                  <div className="text-right text-xs tabular-nums">
                    {formatCurrencyLocal(oneTimeFees)}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-4 gap-4 p-3 font-semibold">
                  <div className="col-span-3 text-sm">Grand Total</div>
                  <div className="text-right text-sm tabular-nums text-primary">
                    {formatCurrencyLocal(yearlyRentAmount + oneTimeFees)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(yearlyRentAmount <= 0 || numberOfCheques <= 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Enter yearly rent amount to see cheque breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChequeBreakdownSection;
