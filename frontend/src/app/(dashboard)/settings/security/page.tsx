'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Monitor, Tablet, MapPin, Clock, Shield, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Session {
  sessionId: string;
  deviceType: string;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Session[]>('/v1/auth/sessions');
      setSessions(response.data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load active sessions');
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;

    try {
      await apiClient.delete(`/v1/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to revoke session');
      console.error('Failed to revoke session:', err);
    }
  };

  const logoutAllOtherDevices = async () => {
    if (!confirm('This will log you out from all other devices. Continue?')) return;

    try {
      const response = await apiClient.post('/v1/auth/logout-all');
      alert(response.data.message || 'Logged out from all other devices');
      fetchSessions(); // Refresh the list
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to logout from all devices');
      console.error('Failed to logout all:', err);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground">
          Manage your active sessions and security preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Active Sessions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage where you&apos;re logged in. You can revoke access to any device at any time.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logoutAllOtherDevices}
                disabled={loading || sessions.length <= 1}
              >
                Logout All Other Devices
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No active sessions found</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`flex items-start justify-between rounded-lg border p-4 ${
                      session.isCurrent ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">{getDeviceIcon(session.deviceType)}</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {session.deviceType || 'Unknown Device'}
                          </p>
                          {session.isCurrent && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                              Current Session
                            </span>
                          )}
                        </div>
                        {session.browser && (
                          <p className="text-sm text-muted-foreground">{session.browser}</p>
                        )}
                        {session.ipAddress && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{session.ipAddress}</span>
                            {session.location && <span>({session.location})</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last active{' '}
                            {formatDistanceToNow(new Date(session.lastActivityAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.sessionId)}
                        className="text-destructive hover:text-destructive"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Sessions automatically expire after 12 hours or 30 minutes of
                inactivity.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card (placeholder for future implementation) */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Password change functionality coming soon. For now, you can reset your password using
              the &quot;Forgot Password&quot; link on the login page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
