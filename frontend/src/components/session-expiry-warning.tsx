'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';

const WARNING_TIME_MINUTES = 5; // Show warning 5 minutes before expiry
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

export function SessionExpiryWarning() {
  const { accessToken, logout, updateAccessToken } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const getTokenExpiry = useCallback((token: string | null): number | null => {
    if (!token) return null;

    try {
      // Decode JWT token (base64 decode the payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/v1/auth/refresh`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      updateAccessToken(data.accessToken);
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await logout();
    }
  }, [updateAccessToken, logout]);

  useEffect(() => {
    const checkExpiry = () => {
      const expiryTime = getTokenExpiry(accessToken);
      if (!expiryTime) {
        setShowWarning(false);
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;
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
  }, [accessToken, getTokenExpiry, logout]);

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

  return (
    <Dialog open={showWarning} onOpenChange={(open) => !open && logout()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Session Expiring Soon</DialogTitle>
          </div>
          <DialogDescription className="pt-4">
            Your session will expire in{' '}
            <span className="font-semibold text-amber-600">
              {formatTime(timeRemaining)}
            </span>
            . Would you like to stay logged in?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          <Clock className="h-4 w-4" />
          <p>Click &quot;Stay Logged In&quot; to extend your session.</p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="w-full sm:w-auto"
          >
            Logout
          </Button>
          <Button
            onClick={() => refreshSession()}
            className="w-full sm:w-auto"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
