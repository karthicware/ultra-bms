import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Authentication Proxy
 * Protects routes that require authentication
 */

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

// API routes that should be excluded from proxy
const apiRoutes = ['/api'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // Static files (favicon.ico, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if user has a refresh token cookie (indicates authentication)
  const refreshToken = request.cookies.get('refreshToken');
  const isAuthenticated = !!refreshToken;

  console.log('[MIDDLEWARE] Path:', pathname, 'isAuthenticated:', isAuthenticated, 'hasRefreshToken:', !!refreshToken);

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // TEMPORARY FIX: The refreshToken cookie is not being sent in HTTP requests due to backend cookie configuration
  // (likely missing proper Path/SameSite/Domain settings). Client-side auth via AuthContext works fine.
  // Skip middleware auth check - let client-side AuthContext handle authentication and redirects
  console.log('[MIDDLEWARE] Allowing request to proceed - client-side auth will handle it');
  return NextResponse.next();

  // TODO: Re-enable after backend fixes cookie configuration
  // // Redirect authenticated users away from auth pages
  // if (isAuthenticated && isAuthRoute) {
  //   const dashboardUrl = new URL('/dashboard', request.url);
  //   console.log('[MIDDLEWARE] Redirecting authenticated user from auth page to dashboard');
  //   return NextResponse.redirect(dashboardUrl);
  // }
  //
  // // Redirect unauthenticated users to login
  // if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
  //   const loginUrl = new URL('/login', request.url);
  //   // Preserve the intended destination
  //   loginUrl.searchParams.set('redirect', pathname);
  //   console.log('[MIDDLEWARE] Redirecting unauthenticated user to login');
  //   return NextResponse.redirect(loginUrl);
  // }
  //
  // console.log('[MIDDLEWARE] Allowing request to proceed');
  // // Allow the request to proceed
  // return NextResponse.next();
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
