/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription className="mt-2">
              You don't have permission to access this page
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This page requires specific permissions that your account doesn't have. If you believe
            this is an error, please contact your administrator.
          </p>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Error Code: 403 - Forbidden
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
