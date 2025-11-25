/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/contexts/auth-context';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DecodedToken {
    exp: number;
    [key: string]: any;
}

export function SessionExpiryWarning() {
    const { isAuthenticated, accessToken, refreshToken, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            return;
        }

        const checkExpiry = () => {
            try {
                const decoded = jwtDecode<DecodedToken>(accessToken);
                const expiryTime = decoded.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();
                const timeRemaining = expiryTime - currentTime;

                // Show warning if less than 5 minutes (300000 ms) remaining
                if (timeRemaining <= 300000 && timeRemaining > 0) {
                    setIsOpen(true);

                    // Format time remaining
                    const minutes = Math.floor(timeRemaining / 60000);
                    const seconds = Math.floor((timeRemaining % 60000) / 1000);
                    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                } else if (timeRemaining <= 0) {
                    // Token expired
                    setIsOpen(false);
                    // We rely on the auth context/interceptor to handle actual expiration, 
                    // but we can force a check or logout if needed.
                    // For now, let's just close the modal as the user will likely be redirected.
                } else {
                    setIsOpen(false);
                }
            } catch (error) {
                console.error('Failed to decode token:', error);
            }
        };

        // Check every second
        const intervalId = setInterval(checkExpiry, 1000);

        // Initial check
        checkExpiry();

        return () => clearInterval(intervalId);
    }, [isAuthenticated, accessToken]);

    const handleStayLoggedIn = async () => {
        try {
            await refreshToken();
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to refresh session:', error);
            // If refresh fails, logout will be handled by the context/interceptor
        }
    };

    const handleLogout = async () => {
        await logout();
        setIsOpen(false);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Session Expiring Soon</AlertDialogTitle>
                    <AlertDialogDescription>
                        Your session will expire in <span className="font-bold text-foreground">{timeLeft}</span>.
                        Would you like to stay logged in?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={handleLogout}>
                        Logout
                    </Button>
                    <AlertDialogAction onClick={handleStayLoggedIn}>
                        Stay Logged In
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
