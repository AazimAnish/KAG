import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, session, supabase } = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Allow these paths to bypass middleware
  if (path.startsWith('/auth') || path.includes('_next') || path.includes('api')) {
    return response;
  }

  try {
    // Define protected routes that require authentication
    const isProtectedRoute = [
      '/dashboard', 
      '/admin', 
      '/profile', 
      '/wardrobe', 
      '/store/checkout', 
      '/store/orders', 
      '/kag-ai'
    ].some(route => path.startsWith(route));
    
    const isAuthRoute = ['/signin', '/signup'].includes(path);

    // If user is authenticated
    if (session) {
      // Redirect logged-in users away from auth routes
      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check admin role for admin routes
      if (path.startsWith('/admin')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      // For authenticated users, allow access to protected routes
      return response;
    }

    // Handle non-authenticated users
    if (isProtectedRoute) {
      // Store the intended URL to redirect back after login
      const redirectUrl = encodeURIComponent(path + request.nextUrl.search);
      return NextResponse.redirect(new URL(`/signin?redirect=${redirectUrl}`, request.url));
    }

    // For non-authenticated users, allow access to public routes
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/wardrobe/:path*',
    '/store/checkout',
    '/store/orders',
    '/signin',
    '/signup',
  ],
};