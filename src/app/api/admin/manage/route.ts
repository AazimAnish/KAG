import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the requesting user is an admin
    const { data: { session } } = await supabase.auth.getSession();
    const { data: requestingUser } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session?.user?.id)
      .single();

    if (!session || requestingUser?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, role } = await request.json();

    // Update user role
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Admin management error:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
} 