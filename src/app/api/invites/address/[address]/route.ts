import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
    // Get invites where the address is either the sender or recipient
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .or(`sender_address.eq.${address},recipient_address.eq.${address}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invite details' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ invites: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 