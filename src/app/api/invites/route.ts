import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseGoerli } from 'viem/chains';
import { supabase } from '@/lib/supabase';
import { CalendarInvite } from '@/lib/supabase';

// Contract details
const CONTRACT_ADDRESS = '0xD2840522281731c251C81CcCf34Ade528E19DBC9';
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getInviteDetails",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "string", "name": "topic", "type": "string" },
          { "internalType": "uint256", "name": "duration", "type": "uint256" },
          { "internalType": "uint256", "name": "validUntil", "type": "uint256" },
          { "internalType": "uint256", "name": "createTime", "type": "uint256" },
          { "internalType": "bool", "name": "redeemed", "type": "bool" },
          { "internalType": "uint256", "name": "redemptionTime", "type": "uint256" }
        ],
        "internalType": "struct InviteToken.Invite",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenIdCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "tokenIdsOf",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize public client for contract interaction
const publicClient = createPublicClient({
  chain: baseGoerli,
  transport: http()
});

// Type for invite data from contract
interface OnChainInvite {
  sender: string;
  recipient: string;
  topic: string;
  duration: bigint;
  validUntil: bigint;
  createTime: bigint;
  redeemed: boolean;
  redemptionTime: bigint;
}

// Type for combined invite data
interface CombinedInvite extends Omit<CalendarInvite, 'id'> {
  tokenId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');

    if (!address && !tokenId) {
      return NextResponse.json({ error: 'Either address or tokenId parameter is required' }, { status: 400 });
    }

    // Fetch invites by token ID
    if (tokenId) {
      const parsedTokenId = parseInt(tokenId);
      if (isNaN(parsedTokenId)) {
        return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
      }

      try {
        // Fetch on-chain data
        const onChainInvite = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'getInviteDetails',
          args: [BigInt(parsedTokenId)]
        }) as unknown as OnChainInvite;

        // Fetch additional data from Supabase
        const { data: supabaseData, error } = await supabase
          .from('calendar_invites')
          .select('*')
          .eq('token_id', parsedTokenId)
          .single();

        // Combine data
        const combinedInvite: CombinedInvite = {
          tokenId: tokenId,
          sender_address: onChainInvite.sender,
          recipient_address: onChainInvite.recipient,
          topic: onChainInvite.topic,
          duration: Number(onChainInvite.duration),
          validity_period: Number(onChainInvite.validUntil),
          created_at: new Date(Number(onChainInvite.createTime) * 1000).toISOString(),
          redeemed: onChainInvite.redeemed,
          redemption_time: onChainInvite.redeemed ? new Date(Number(onChainInvite.redemptionTime) * 1000).toISOString() : null,
          // Include additional Supabase data if available
          recipient_email: supabaseData?.recipient_email || null,
          calendar_event_id: supabaseData?.calendar_event_id || null,
          start_time: supabaseData?.start_time || null,
        };

        return NextResponse.json(combinedInvite);
      } catch (error) {
        console.error('Error fetching token details:', error);
        return NextResponse.json({ error: 'Failed to fetch invite details' }, { status: 500 });
      }
    }

    // Fetch invites by address
    if (address) {
      try {
        // Get token IDs owned by address
        const tokenIds = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'tokenIdsOf',
          args: [address as `0x${string}`]
        }) as unknown as bigint[];

        // Get token IDs where address is recipient
        const { data: recipientInvites, error: recipientError } = await supabase
          .from('calendar_invites')
          .select('token_id')
          .eq('recipient_address', address.toLowerCase());

        if (recipientError) {
          console.error('Error fetching recipient invites:', recipientError);
        }

        // Combine both sets of token IDs
        const allTokenIds = new Set([
          ...tokenIds.map(id => Number(id)), 
          ...(recipientInvites?.map(invite => invite.token_id) || [])
        ]);

        // Fetch details for each token ID
        const invites = await Promise.all(
          Array.from(allTokenIds).map(async (id) => {
            try {
              // Fetch on-chain data
              const onChainInvite = await publicClient.readContract({
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: CONTRACT_ABI,
                functionName: 'getInviteDetails',
                args: [BigInt(id)]
              }) as unknown as OnChainInvite;

              // Fetch additional data from Supabase
              const { data: supabaseData } = await supabase
                .from('calendar_invites')
                .select('*')
                .eq('token_id', id)
                .single();

              // Combine data
              return {
                tokenId: id.toString(),
                sender_address: onChainInvite.sender,
                recipient_address: onChainInvite.recipient,
                topic: onChainInvite.topic,
                duration: Number(onChainInvite.duration),
                validity_period: Number(onChainInvite.validUntil),
                created_at: new Date(Number(onChainInvite.createTime) * 1000).toISOString(),
                redeemed: onChainInvite.redeemed,
                redemption_time: onChainInvite.redeemed ? new Date(Number(onChainInvite.redemptionTime) * 1000).toISOString() : null,
                // Include additional Supabase data if available
                recipient_email: supabaseData?.recipient_email || null,
                calendar_event_id: supabaseData?.calendar_event_id || null,
                start_time: supabaseData?.start_time || null,
              };
            } catch (error) {
              console.error(`Error fetching details for token ${id}:`, error);
              return null;
            }
          })
        );

        // Filter out any failed fetches
        const validInvites = invites.filter(invite => invite !== null);

        return NextResponse.json(validInvites);
      } catch (error) {
        console.error('Error fetching invites:', error);
        return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 