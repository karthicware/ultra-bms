'use client';

/**
 * Dashboard Filters Component
 * Story 8.1: Executive Summary Dashboard
 * AC-10: Property and date range filters
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Filter, RefreshCw, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { format, startOfYear, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardFiltersProps {
  onFilterChange: (filters: DashboardFilterValues) => void;
  isLoading?: boolean;
  className?: string;
}

export interface DashboardFilterValues {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

interface Property {
  id: string;
  name: string;
}

interface PropertyListResponse {
  success: boolean;
  data: {
    content: Property[];
  };
}

// ============================================================================
// PRESETS
// ============================================================================

const DATE_PRESETS = [
  { label: 'This Year', value: 'ytd' },
  { label: 'Last 12 Months', value: '12m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'This Month', value: 'mtd' }
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DashboardFilters({
  onFilterChange,
  isLoading = false,
  className
}: DashboardFiltersProps) {
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: new Date()
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('ytd');

  // Fetch properties for dropdown
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', 'list', 'active'],
    queryFn: async () => {
      const response = await apiClient.get<PropertyListResponse>(
        '/v1/properties?status=ACTIVE&size=100'
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const properties = propertiesData?.data?.content ?? [];

  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    const now = new Date();

    let from: Date;
    const to = now;

    switch (preset) {
      case 'ytd':
        from = startOfYear(now);
        break;
      case '12m':
        from = new Date(now);
        from.setMonth(from.getMonth() - 12);
        break;
      case '6m':
        from = new Date(now);
        from.setMonth(from.getMonth() - 6);
        break;
      case '3m':
        from = new Date(now);
        from.setMonth(from.getMonth() - 3);
        break;
      case 'mtd':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        from = startOfYear(now);
    }

    setDateRange({ from, to });
  };

  // Handle custom date range selection
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setSelectedPreset('');
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange({
      propertyId: propertyId === 'all' ? undefined : propertyId,
      startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setPropertyId(undefined);
    setDateRange({
      from: startOfYear(new Date()),
      to: new Date()
    });
    setSelectedPreset('ytd');
    onFilterChange({});
  };

  // Apply filters on initial load and when values change
  useEffect(() => {
    handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className={cn('', className)}>
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        {/* Property Filter */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={propertyId ?? 'all'}
            onValueChange={(value) => setPropertyId(value === 'all' ? undefined : value)}
            disabled={isLoadingProperties}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Preset Buttons */}
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div className="flex rounded-md border">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-none border-r last:border-r-0',
                  selectedPreset === preset.value && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handlePresetChange(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <DatePickerWithRange
          date={dateRange}
          onDateChange={handleDateRangeChange}
          className="w-auto"
        />

        {/* Action Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleApplyFilters}
            disabled={isLoading}
          >
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
