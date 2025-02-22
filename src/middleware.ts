import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, session, supabase } = await updateSession(request);

  const path = request.nextUrl.pathname;

  // Allow auth callback route to bypass middleware
  if (path.startsWith('/auth')) {
    return response;
  }

  try {
    // Handle authentication state
    const isProtectedRoute = ['/dashboard', '/admin', '/profile', '/wardrobe', '/store/checkout', '/store/orders', '/dashboard/kag-ai']
      .some(route => path.startsWith(route));
    const isAuthRoute = ['/signin', '/signup'].includes(path);

    if (session) {
      // Redirect logged-in users away from auth routes
      if (isAuthRoute) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const redirectUrl = profile?.role === 'admin' ? '/admin' : '/profile';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      // Check admin role for admin routes
      if (path.startsWith('/admin')) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      return response;
    }

    // Handle non-authenticated users
    if (isProtectedRoute) {
      const redirectUrl = encodeURIComponent(path + request.nextUrl.search);
      return NextResponse.redirect(new URL(`/signin?redirect=${redirectUrl}`, request.url));
    }

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