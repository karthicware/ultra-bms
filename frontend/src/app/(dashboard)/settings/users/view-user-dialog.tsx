'use client';

/**
 * View User Dialog
 * Read-only dialog displaying user details
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminUser } from '@/types/admin-users';
import { USER_STATUS_STYLES, ROLE_DISPLAY_NAMES } from '@/types/admin-users';
import { format } from 'date-fns';
import { Mail, Phone, Shield, Calendar, Clock } from 'lucide-react';

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
}

export default function ViewUserDialog({
  open,
  onOpenChange,
  user,
}: ViewUserDialogProps) {
  if (!user) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch {
      return '-';
    }
  };

  const statusStyle = USER_STATUS_STYLES[user.status] || USER_STATUS_STYLES.ACTIVE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user account information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </span>
            <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>

          {/* Phone */}
          {user.phone && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{user.phone}</span>
            </div>
          )}

          {/* Role */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{ROLE_DISPLAY_NAMES[user.role] || user.role}</span>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Created: {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Updated: {formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
