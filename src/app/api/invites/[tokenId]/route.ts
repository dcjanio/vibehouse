import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  try {
    const { tokenId } = params;
    
    // Get invite details from Supabase
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('token_id', tokenId)
      .single();
    
    if (error) {
      console.error('Error fetching invite:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invite details' },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ invite: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 