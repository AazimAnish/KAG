import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      
      await supabase.auth.exchangeCodeForSession(code);

      // Ensure session is set before redirecting
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        return NextResponse.redirect(new URL('/dashboard/wardrobe', request.url));
      }
    }

    return NextResponse.redirect(new URL('/signin?error=session_error', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/signin?error=auth_error', request.url));
  }
}

export const dynamic = 'force-dynamic'; 