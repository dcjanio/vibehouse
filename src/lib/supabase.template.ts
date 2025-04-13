import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or anon key is not defined. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the shape of calendar invite data
export interface CalendarInvite {
  id?: number;
  token_id: number | string;
  sender_address: string;
  recipient_address: string;
  recipient_email?: string;
  topic: string;
  duration: number;
  expiration: number;
  is_redeemed: boolean;
  redeemed_at?: string;
  scheduled_time?: string;
  transaction_hash?: string;
  created_at?: string;
  updated_at?: string;
}

// Store a new invite in the database
export async function storeInvite(invite: Partial<CalendarInvite>) {
  try {
    console.log("Storing invite in Supabase:", invite);
    
    // Ensure required fields are present
    if (!invite.sender_address) {
      throw new Error("sender_address is required");
    }
    
    if (!invite.recipient_address) {
      throw new Error("recipient_address is required");
    }
    
    // Format addresses to lowercase for consistency
    const formattedInvite = {
      ...invite,
      sender_address: invite.sender_address.toLowerCase(),
      recipient_address: invite.recipient_address.toLowerCase(),
      // Default values for required fields
      is_redeemed: invite.is_redeemed ?? false,
      created_at: invite.created_at || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('calendar_invites')
      .insert(formattedInvite)
      .select()
      .single();
    
    if (error) {
      console.error("Supabase error storing invite:", error);
      throw error;
    }
    
    console.log("Successfully stored invite:", data);
    return data;
  } catch (error) {
    console.error("Failed to store invite:", error);
    throw error;
  }
}

// Add remaining functions as needed... 