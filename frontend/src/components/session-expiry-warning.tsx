/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getTimeUntilExpiration } from '@/lib/jwt-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';

const WARNING_TIME_MINUTES = 5; // Show warning 5 minutes before expiry
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export function SessionExpiryWarning() {
  const { user, logout, refreshToken } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const handleStayLoggedIn = useCallback(async () => {
    try {
      await refreshToken();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await logout();
    }
  }, [refreshToken, logout]);

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const checkExpiry = () => {
      // Get access token from context (we need to access it somehow)
      // For now, we'll use a simplified approach
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) {
        setShowWarning(false);
        return;
      }

      const timeUntilExpiry = getTimeUntilExpiration(accessToken);
      const warningThreshold = WARNING_TIME_MINUTES * 60 * 1000;

      if (timeUntilExpiry <= 0) {
        // Token expired - logout
        logout();
      } else if (timeUntilExpiry <= warningThreshold) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(Math.floor(timeUntilExpiry / 1000)); // Convert to seconds
      } else {
        // Token still valid
        setShowWarning(false);
      }
    };

    // Initial check
    checkExpiry();

    // Set up interval to check periodically
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, logout]);

  // Countdown timer
  useEffect(() => {
    if (!showWarning || timeRemaining <= 0) return;

    const countdown = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-logout when time runs out
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [showWarning, timeRemaining, logout]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <Dialog open={showWarning} onOpenChange={(open) => !open && logout()}>
      <DialogContent className="sm:max-w-md" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            Your session will expire in{' '}
            <span className="font-semibold text-warning" role="timer" aria-live="polite">
              {formatTime(timeRemaining)}
            </span>
            . Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-warning/20 bg-warning/10">
          <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
          <AlertDescription className="text-warning-foreground">
            Click "Stay Logged In" to extend your session, or you'll be automatically logged out
            when the timer reaches zero.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full sm:w-auto"
          >
            Logout Now
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            className="w-full sm:w-auto"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
