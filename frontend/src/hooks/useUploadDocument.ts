/**
 * React Query mutation hook for uploading documents
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadDocument } from '@/services/tenant-portal.service';
import type { TenantDocument } from '@/types/tenant';

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type?: string }) => uploadDocument(file, type),
    onSuccess: () => {
      // Invalidate profile query to refetch documents list
      queryClient.invalidateQueries({ queryKey: ['tenant', 'profile'] });

      toast.success('Document uploaded successfully');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to upload document';
      toast.error(message);
    },
  });
}
