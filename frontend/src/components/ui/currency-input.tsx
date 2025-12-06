'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps {
  value?: number | null | string;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  currency?: string;
  'data-testid'?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      min = 0,
      max,
      disabled,
      placeholder = '0',
      className,
      id,
      name,
      currency = 'AED',
      'data-testid': dataTestId,
    },
    ref
  ) => {
    // Convert null/string values to displayable string (whole numbers only)
    const displayValue = React.useMemo(() => {
      if (value === null || value === undefined || value === '') {
        return '';
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? '' : parsed.toString();
      }
      return Math.round(value).toString(); // Round to whole number
    }, [value]);

    const [localValue, setLocalValue] = React.useState(displayValue);

    // Sync local value when prop changes
    React.useEffect(() => {
      setLocalValue(displayValue);
    }, [displayValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Allow empty string
      if (rawValue === '') {
        setLocalValue('');
        return;
      }

      // Only allow valid number input (digits only, no decimals)
      if (!/^\d*$/.test(rawValue)) {
        return;
      }

      // Just update local state during typing - don't call onChange until blur
      setLocalValue(rawValue);
    };

    const handleBlur = () => {
      // Format value on blur - default to 0 if empty
      let numValue = parseInt(localValue, 10); // Use parseInt for whole numbers only

      if (isNaN(numValue)) {
        // If empty or invalid, set to min or 0
        numValue = min !== undefined ? min : 0;
      } else {
        // Apply min/max constraints
        if (min !== undefined && numValue < min) {
          numValue = min;
        }
        if (max !== undefined && numValue > max) {
          numValue = max;
        }
      }

      setLocalValue(numValue.toString());
      onChange?.(numValue);
      onBlur?.();
    };

    return (
      <div
        className={cn(
          'flex h-9 w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-all',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
      >
        {/* Currency prefix */}
        <div className="flex h-full items-center border-r border-input bg-muted/50 px-3">
          <span className="text-sm font-medium text-muted-foreground select-none">
            {currency}
          </span>
        </div>

        {/* Input field */}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          id={id}
          name={name}
          value={localValue}
          defaultValue={defaultValue?.toString()}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          data-testid={dataTestId}
          className={cn(
            'flex-1 bg-transparent px-3 py-2 text-sm tabular-nums outline-none',
            'placeholder:text-muted-foreground',
            'selection:bg-primary selection:text-primary-foreground'
          )}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
