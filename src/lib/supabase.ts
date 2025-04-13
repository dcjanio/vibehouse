import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values for development
// In production, these should come from environment variables
const supabaseUrl = 'https://zfoufwqtntqbzsydykgw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3Vmd3F0bnRxYnpzeWR5a2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzUyNDYsImV4cCI6MjA2MDExMTI0Nn0.KD5syt4CylQrCBBrCBPT9zl1jrZ9-ZANemZosLjAGgE';

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

// Get invites sent by a specific address
export async function getSentInvites(senderAddress: string): Promise<CalendarInvite[]> {
  try {
    console.log("Getting sent invites for:", senderAddress);
    
    // Ensure address is correctly formatted
    const formattedAddress = senderAddress.toLowerCase();
    
    // First try exact match
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('sender_address', formattedAddress)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase error getting sent invites:", error);
      throw error;
    }
    
    // If no results, try case-insensitive search
    if (!data || data.length === 0) {
      console.log("No results with exact match, trying case-insensitive search");
      const { data: ciData, error: ciError } = await supabase
        .from('calendar_invites')
        .select('*')
        .ilike('sender_address', formattedAddress)
        .order('created_at', { ascending: false });
      
      if (ciError) {
        console.error("Supabase error with case-insensitive search:", ciError);
      } else if (ciData && ciData.length > 0) {
        console.log(`Found ${ciData.length} sent invites with case-insensitive search`);
        return ciData;
      }
    }
    
    console.log(`Found ${data?.length || 0} sent invites`);
    return data || [];
  } catch (error) {
    console.error("Failed to get sent invites:", error);
    return [];
  }
}

// Get invites received by a specific address
export async function getReceivedInvites(recipientAddress: string): Promise<CalendarInvite[]> {
  try {
    console.log("Getting received invites for:", recipientAddress);
    
    // Ensure address is correctly formatted
    const formattedAddress = recipientAddress.toLowerCase();
    
    // First try exact match
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('recipient_address', formattedAddress)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase error getting received invites:", error);
      throw error;
    }
    
    // If no results, try case-insensitive search
    if (!data || data.length === 0) {
      console.log("No results with exact match, trying case-insensitive search");
      const { data: ciData, error: ciError } = await supabase
        .from('calendar_invites')
        .select('*')
        .ilike('recipient_address', formattedAddress)
        .order('created_at', { ascending: false });
      
      if (ciError) {
        console.error("Supabase error with case-insensitive search:", ciError);
      } else if (ciData && ciData.length > 0) {
        console.log(`Found ${ciData.length} received invites with case-insensitive search`);
        return ciData;
      }
    }
    
    console.log(`Found ${data?.length || 0} received invites`);
    return data || [];
  } catch (error) {
    console.error("Failed to get received invites:", error);
    return [];
  }
}

// Get a specific invite by token ID
export async function getInviteByTokenId(tokenId: number | string): Promise<CalendarInvite | null> {
  try {
    console.log("Getting invite for token ID:", tokenId);
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('token_id', tokenId.toString())
      .single();
    
    if (error) {
      console.error("Supabase error getting invite by token ID:", error);
      throw error;
    }
    
    console.log("Found invite:", data);
    return data;
  } catch (error) {
    console.error("Failed to get invite by token ID:", error);
    return null;
  }
}

// Mark an invite as redeemed and set the scheduled time
export async function redeemInvite(tokenId: number | string, scheduledTime: string, email?: string): Promise<void> {
  try {
    console.log(`Redeeming invite ${tokenId} for time ${scheduledTime}${email ? ` with email ${email}` : ''}`);
    
    const updateData: any = { 
      is_redeemed: true,
      scheduled_time: scheduledTime,
      redeemed_at: new Date().toISOString()
    };
    
    // Only add email if provided
    if (email) {
      updateData.recipient_email = email;
    }
    
    const { error } = await supabase
      .from('calendar_invites')
      .update(updateData)
      .eq('token_id', tokenId.toString());
    
    if (error) {
      console.error("Supabase error redeeming invite:", error);
      throw error;
    }
    
    console.log("Successfully redeemed invite");
  } catch (error) {
    console.error("Failed to redeem invite:", error);
    throw error;
  }
}

// Verify if a user has the right to redeem a specific token
export async function verifyTokenOwnership(tokenId: number | string, walletAddress: string): Promise<boolean> {
  try {
    console.log(`Verifying token ${tokenId} ownership for ${walletAddress}`);
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('token_id', tokenId.toString())
      .eq('recipient_address', walletAddress.toLowerCase())
      .single();
    
    if (error) {
      console.error("Supabase error verifying token ownership:", error);
      return false;
    }
    
    console.log("Ownership verification result:", data ? true : false);
    return !!data;
  } catch (error) {
    console.error("Failed to verify token ownership:", error);
    return false;
  }
}

// Get transaction by hash
export async function getTransactionByHash(txHash: string): Promise<CalendarInvite | null> {
  try {
    console.log("Getting transaction by hash:", txHash);
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .eq('transaction_hash', txHash)
      .single();
    
    if (error) {
      console.error("Supabase error getting transaction:", error);
      throw error;
    }
    
    console.log("Found transaction:", data);
    return data;
  } catch (error) {
    console.error("Failed to get transaction by hash:", error);
    return null;
  }
}

// Get all invites for admin purposes
export async function getAllInvites(): Promise<CalendarInvite[]> {
  try {
    const { data, error } = await supabase
      .from('calendar_invites')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Supabase error getting all invites:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Failed to get all invites:", error);
    return [];
  }
}

// Helper functions for invite operations
export async function getInvitesByAddress(address: string) {
  const { data, error } = await supabase
    .from('calendar_invites')
    .select('*')
    .eq('recipient_address', address.toLowerCase());
  
  if (error) {
    console.error(`Error fetching invites for address ${address}:`, error);
    throw error;
  }
  
  return data || [];
}

// Get all invites either sent or received by a wallet address
export async function getAllInvitesByAddress(address: string) {
  const lowerAddress = address.toLowerCase();
  
  const { data, error } = await supabase
    .from('calendar_invites')
    .select('*')
    .or(`recipient_address.eq.${lowerAddress},sender_address.eq.${lowerAddress}`);
  
  if (error) {
    console.error(`Error fetching all invites for address ${address}:`, error);
    throw error;
  }
  
  return data || [];
}

export async function updateInvite(tokenId: number | string, updates: Partial<CalendarInvite>) {
  const { data, error } = await supabase
    .from('calendar_invites')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('token_id', tokenId.toString())
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating invite for token ID ${tokenId}:`, error);
    throw error;
  }
  
  return data;
}

export async function markInviteAsRedeemed(tokenId: number | string, meetingTime: string, meetingUrl: string) {
  return updateInvite(tokenId, {
    is_redeemed: true,
    scheduled_time: meetingTime,
    redeemed_at: new Date().toISOString()
  });
}

// Debug function to test Supabase connection and data
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tables?: string[];
  error?: any;
  tableData?: any;
}> {
  try {
    // First check if we can query the table
    const { data: tableData, error: tableError } = await supabase
      .from('calendar_invites')
      .select('count(*)');
    
    if (tableError) {
      console.error("Error checking calendar_invites table:", tableError);
      // Try to list all tables to see what's available
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_tables');
      
      if (tablesError) {
        console.error("Error listing tables:", tablesError);
        return { 
          connected: false, 
          error: { tableError, tablesError } 
        };
      }
      
      return {
        connected: true,
        tables: tablesData,
        error: tableError
      };
    }
    
    // Get a sample of data
    const { data: sampleData, error: sampleError } = await supabase
      .from('calendar_invites')
      .select('*')
      .limit(5);
    
    return {
      connected: true,
      tableData: {
        count: tableData,
        sample: sampleData,
        error: sampleError
      }
    };
  } catch (error) {
    console.error("Error testing Supabase connection:", error);
    return {
      connected: false,
      error
    };
  }
} 