'use client';

/**
 * PropertyFilter Component
 * Story 6.4: Financial Reporting and Analytics
 * AC #27: Reusable property filter with "All Properties" option
 */

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getProperties } from '@/services/properties.service';

export interface PropertyFilterProps {
  value?: string;
  onChange: (propertyId: string | undefined) => void;
  syncToUrl?: boolean;
  className?: string;
  placeholder?: string;
}

const ALL_PROPERTIES_VALUE = '__all__';

export function PropertyFilter({
  value,
  onChange,
  syncToUrl = false,
  className,
  placeholder = 'All Properties',
}: PropertyFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch properties list
  const { data: propertiesResponse, isLoading } = useQuery({
    queryKey: ['properties', 'filter-list'],
    queryFn: () => getProperties({ page: 0, size: 100 }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const properties = propertiesResponse?.content || [];

  // Initialize from URL
  useEffect(() => {
    if (syncToUrl) {
      const urlPropertyId = searchParams.get('propertyId');
      if (urlPropertyId && urlPropertyId !== value) {
        onChange(urlPropertyId);
      }
    }
  }, [searchParams, syncToUrl, onChange, value]);

  // Handle selection change
  const handleChange = (newValue: string) => {
    const propertyId = newValue === ALL_PROPERTIES_VALUE ? undefined : newValue;
    onChange(propertyId);

    if (syncToUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (propertyId) {
        params.set('propertyId', propertyId);
      } else {
        params.delete('propertyId');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  return (
    <Select
      value={value || ALL_PROPERTIES_VALUE}
      onValueChange={handleChange}
    >
      <SelectTrigger
        className={cn('w-[200px]', className)}
        data-testid="property-filter"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PROPERTIES_VALUE} data-testid="property-filter-all">
          {placeholder}
        </SelectItem>
        {properties.map((property) => (
          <SelectItem
            key={property.id}
            value={property.id}
            data-testid={`property-filter-${property.id}`}
          >
            {property.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PropertyFilter;
