'use client';

/**
 * DateRangeSelector Component
 * Story 6.4: Financial Reporting and Analytics
 * AC #26: Reusable date range selector with presets and custom range
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, startOfYear, endOfYear, subYears } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DateRangePreset, getDateRangePresetLabel } from '@/types/reports';
import type { DateRange } from 'react-day-picker';

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

export interface DateRangeSelectorProps {
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  defaultPreset?: DateRangePreset;
  syncToUrl?: boolean;
  className?: string;
}

/**
 * Get date range from preset
 */
function getDateRangeFromPreset(preset: DateRangePreset): DateRangeValue {
  const now = new Date();

  switch (preset) {
    case DateRangePreset.THIS_MONTH:
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    case DateRangePreset.LAST_MONTH: {
      const lastMonth = subMonths(now, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    }
    case DateRangePreset.THIS_QUARTER:
      return {
        startDate: format(startOfQuarter(now), 'yyyy-MM-dd'),
        endDate: format(endOfQuarter(now), 'yyyy-MM-dd'),
      };
    case DateRangePreset.LAST_QUARTER: {
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: format(startOfQuarter(lastQuarter), 'yyyy-MM-dd'),
        endDate: format(endOfQuarter(lastQuarter), 'yyyy-MM-dd'),
      };
    }
    case DateRangePreset.THIS_YEAR:
      return {
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfYear(now), 'yyyy-MM-dd'),
      };
    case DateRangePreset.LAST_YEAR: {
      const lastYear = subYears(now, 1);
      return {
        startDate: format(startOfYear(lastYear), 'yyyy-MM-dd'),
        endDate: format(endOfYear(lastYear), 'yyyy-MM-dd'),
      };
    }
    case DateRangePreset.CUSTOM:
    default:
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
  }
}

export function DateRangeSelector({
  value,
  onChange,
  defaultPreset = DateRangePreset.THIS_MONTH,
  syncToUrl = false,
  className,
}: DateRangeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL or default
  const [preset, setPreset] = useState<DateRangePreset>(() => {
    if (syncToUrl) {
      const urlPreset = searchParams.get('preset');
      if (urlPreset && Object.values(DateRangePreset).includes(urlPreset as DateRangePreset)) {
        return urlPreset as DateRangePreset;
      }
    }
    return defaultPreset;
  });

  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => {
    if (syncToUrl) {
      const start = searchParams.get('startDate');
      const end = searchParams.get('endDate');
      if (start && end) {
        return {
          from: new Date(start),
          to: new Date(end),
        };
      }
    }
    return undefined;
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sync to URL when values change
  useEffect(() => {
    if (syncToUrl) {
      const params = new URLSearchParams(searchParams.toString());
      const dateRange = preset === DateRangePreset.CUSTOM && customRange?.from && customRange?.to
        ? {
            startDate: format(customRange.from, 'yyyy-MM-dd'),
            endDate: format(customRange.to, 'yyyy-MM-dd'),
          }
        : getDateRangeFromPreset(preset);

      params.set('preset', preset);
      params.set('startDate', dateRange.startDate);
      params.set('endDate', dateRange.endDate);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [preset, customRange, syncToUrl, pathname, router, searchParams]);

  // Handle preset change
  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== DateRangePreset.CUSTOM) {
      const dateRange = getDateRangeFromPreset(newPreset);
      onChange(dateRange);
    }
  };

  // Handle custom range change
  const handleCustomRangeChange = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setPreset(DateRangePreset.CUSTOM);
      onChange({
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      });
      setIsCalendarOpen(false);
    }
  };

  // Current display value
  const currentRange = preset === DateRangePreset.CUSTOM && customRange?.from && customRange?.to
    ? {
        startDate: format(customRange.from, 'yyyy-MM-dd'),
        endDate: format(customRange.to, 'yyyy-MM-dd'),
      }
    : value || getDateRangeFromPreset(preset);

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="date-range-selector">
      {/* Preset Selector */}
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-[160px]" data-testid="date-range-preset">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(DateRangePreset).map((p) => (
            <SelectItem key={p} value={p}>
              {getDateRangePresetLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Range Picker */}
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[240px] justify-start text-left font-normal',
              !currentRange && 'text-muted-foreground'
            )}
            data-testid="date-range-custom"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentRange ? (
              <>
                {format(new Date(currentRange.startDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(currentRange.endDate), 'MMM d, yyyy')}
              </>
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={customRange?.from || new Date()}
            selected={customRange}
            onSelect={handleCustomRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangeSelector;
