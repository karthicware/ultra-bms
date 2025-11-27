'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StarRatingInput Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Reusable star rating input with:
 * - Click to select rating
 * - Hover preview
 * - Keyboard navigation (arrow keys, Enter)
 * - Accessibility (ARIA labels)
 * - Touch-friendly (44x44px targets)
 */

interface StarRatingInputProps {
  /** Current rating value (1-5, 0 for unrated) */
  value: number;
  /** Callback when rating changes */
  onChange: (value: number) => void;
  /** Label for accessibility */
  label: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show rating label text */
  showLabel?: boolean;
  /** data-testid prefix for testing */
  testIdPrefix?: string;
}

const sizeConfig = {
  sm: { star: 'w-5 h-5', container: 'gap-0.5' },
  md: { star: 'w-7 h-7', container: 'gap-1' },
  lg: { star: 'w-9 h-9', container: 'gap-1.5' }
};

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export function StarRatingInput({
  value,
  onChange,
  label,
  disabled = false,
  size = 'md',
  showLabel = true,
  testIdPrefix = 'star-rating'
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const displayValue = hoverValue || value;
  const config = sizeConfig[size];

  const handleClick = useCallback(
    (rating: number) => {
      if (!disabled) {
        onChange(rating);
      }
    },
    [disabled, onChange]
  );

  const handleMouseEnter = useCallback(
    (rating: number) => {
      if (!disabled) {
        setHoverValue(rating);
      }
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverValue(0);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          const nextValue = Math.min(5, (value || 0) + 1);
          onChange(nextValue);
          setFocusedIndex(nextValue - 1);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          const prevValue = Math.max(1, (value || 2) - 1);
          onChange(prevValue);
          setFocusedIndex(prevValue - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0) {
            onChange(focusedIndex + 1);
          }
          break;
        case 'Home':
          e.preventDefault();
          onChange(1);
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          onChange(5);
          setFocusedIndex(4);
          break;
      }
    },
    [disabled, value, focusedIndex, onChange]
  );

  return (
    <div
      className="flex flex-col gap-1"
      data-testid={`${testIdPrefix}-container`}
    >
      {showLabel && (
        <span
          className="text-sm font-medium text-foreground"
          id={`${testIdPrefix}-label`}
        >
          {label}
        </span>
      )}

      <div
        className={cn(
          'flex items-center',
          config.container,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        role="radiogroup"
        aria-label={label}
        aria-labelledby={showLabel ? `${testIdPrefix}-label` : undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onMouseLeave={handleMouseLeave}
        data-testid={`${testIdPrefix}-input`}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={value === rating}
            aria-label={`${rating} star${rating !== 1 ? 's' : ''} - ${ratingLabels[rating]}`}
            disabled={disabled}
            className={cn(
              'p-1 rounded-md transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              'hover:scale-110',
              // Touch-friendly: minimum 44x44px target
              'min-w-[44px] min-h-[44px] flex items-center justify-center',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            )}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onFocus={() => setFocusedIndex(rating - 1)}
            onBlur={() => setFocusedIndex(-1)}
            data-testid={`${testIdPrefix}-star-${rating}`}
          >
            <Star
              className={cn(
                config.star,
                'transition-colors duration-150',
                rating <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground/40'
              )}
            />
          </button>
        ))}

        {/* Rating text */}
        <span
          className={cn(
            'ml-2 text-sm font-medium min-w-[80px]',
            displayValue > 0 ? 'text-foreground' : 'text-muted-foreground'
          )}
          data-testid={`${testIdPrefix}-label-text`}
        >
          {displayValue > 0 ? ratingLabels[displayValue] : 'Not rated'}
        </span>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {value > 0
          ? `Selected ${value} star${value !== 1 ? 's' : ''}, ${ratingLabels[value]}`
          : 'No rating selected'}
      </div>
    </div>
  );
}

/**
 * StarRatingDisplay Component
 * Read-only display of star rating
 */
interface StarRatingDisplayProps {
  /** Rating value (0-5) */
  value: number;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show numeric value */
  showValue?: boolean;
  /** Total number of ratings */
  totalRatings?: number;
  /** data-testid prefix */
  testIdPrefix?: string;
}

const displaySizeConfig = {
  xs: { star: 'w-3 h-3', text: 'text-xs' },
  sm: { star: 'w-4 h-4', text: 'text-sm' },
  md: { star: 'w-5 h-5', text: 'text-base' },
  lg: { star: 'w-6 h-6', text: 'text-lg' }
};

export function StarRatingDisplay({
  value,
  size = 'sm',
  showValue = true,
  totalRatings,
  testIdPrefix = 'star-display'
}: StarRatingDisplayProps) {
  const config = displaySizeConfig[size];
  const roundedValue = Math.round(value * 10) / 10;

  return (
    <div
      className="flex items-center gap-1"
      data-testid={`${testIdPrefix}-container`}
      aria-label={`Rating: ${roundedValue} out of 5 stars${totalRatings ? `, ${totalRatings} ratings` : ''}`}
    >
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillPercentage = Math.min(100, Math.max(0, (value - star + 1) * 100));

          return (
            <div key={star} className="relative" data-testid={`${testIdPrefix}-star-${star}`}>
              {/* Background (empty) star */}
              <Star
                className={cn(config.star, 'text-muted-foreground/30 fill-transparent')}
              />
              {/* Foreground (filled) star with clip */}
              {fillPercentage > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star
                    className={cn(config.star, 'text-yellow-400 fill-yellow-400')}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showValue && (
        <span
          className={cn(config.text, 'font-medium text-foreground ml-1')}
          data-testid={`${testIdPrefix}-value`}
        >
          {roundedValue.toFixed(1)}
        </span>
      )}

      {totalRatings !== undefined && (
        <span
          className={cn(config.text, 'text-muted-foreground')}
          data-testid={`${testIdPrefix}-count`}
        >
          ({totalRatings})
        </span>
      )}
    </div>
  );
}

export default StarRatingInput;
