import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const redirectTo = requestUrl.searchParams.get('redirect') || '/profile';

    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Exchange code for session
      const { data: { session }, error: authError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (authError || !session) {
        console.error('Auth error:', authError);
        return NextResponse.redirect(new URL('/signin?error=auth_error', request.url));
      }

      // Manually set the session cookie
      const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]}-auth-token`;
      const cookieValue = JSON.stringify(session);
      const res = NextResponse.next();
      res.cookies.set(cookieName, cookieValue, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', session.user.id)
        .single();
 
      if (!existingProfile) {
        // Create new profile
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: session.user.id,
            email: session.user.email,
            name: session.user.email?.split('@')[0],
            role: 'user',
            created_at: new Date().toISOString(),
          }]);

        if (createError) {
          console.error('Profile creation error:', createError);
          return NextResponse.redirect(new URL('/signin?error=profile_creation', request.url));
        }

        // Redirect new users to profile setup
        return NextResponse.redirect(new URL('/profile', request.url));
      }

      // Redirect based on role or stored redirect path
      const redirectUrl = existingProfile.role === 'admin' ? '/admin' : redirectTo;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    return NextResponse.redirect(new URL('/signin?error=no_code', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=server_error', request.url));
  }
}

export const dynamic = 'force-dynamic';