'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Building2, Star, CheckCircle } from 'lucide-react';
import { vendorsService } from '@/services/vendors.service';
import { VendorStatus, type VendorListItem } from '@/types/vendors';
import { cn } from '@/lib/utils';

/**
 * VendorSearchSelect Component
 * Story 5.3: Vendor Performance Tracking and Rating
 *
 * Searchable vendor selector for comparison feature (AC #13)
 */

interface VendorSearchSelectProps {
  /** Callback when vendor is selected */
  onSelect: (vendorId: string) => void;
  /** IDs to exclude from results */
  excludeIds?: string[];
  /** Placeholder text */
  placeholder?: string;
}

export function VendorSearchSelect({
  onSelect,
  excludeIds = [],
  placeholder = 'Search vendors...'
}: VendorSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Search vendors
  const { data, isLoading } = useQuery({
    queryKey: ['vendors', 'search', search],
    queryFn: async () => {
      const response = await vendorsService.getVendors({
        search: search || undefined,
        page: 0,
        size: 20,
        status: VendorStatus.ACTIVE
      });
      return response.data.content;
    },
    enabled: open
  });

  // Filter out excluded vendors
  const filteredVendors = (data ?? []).filter(
    v => !excludeIds.includes(v.id)
  );

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (vendor: VendorListItem) => {
    onSelect(vendor.id);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          data-testid="btn-add-vendor"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-vendor-search"
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              {search ? 'No vendors found' : 'Start typing to search'}
            </div>
          ) : (
            <div className="p-2">
              {filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelect(vendor)}
                  className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-md',
                    'hover:bg-muted transition-colors text-left'
                  )}
                  data-testid={`vendor-option-${vendor.id}`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{vendor.companyName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{vendor.vendorNumber}</span>
                      {vendor.rating !== undefined && vendor.rating > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            {vendor.rating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-muted-foreground/30" />
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default VendorSearchSelect;
