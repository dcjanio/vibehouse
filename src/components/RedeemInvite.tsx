'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { sdk } from '@farcaster/frame-sdk';
import Link from 'next/link';

// Using the deployed testnet contract address
const CONTRACT_ADDRESS = '0x12d23ebdA380859087b441C9De907ce00bD58662';
const ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "redeemInvite",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "invites",
    "outputs": [
      {
        "internalType": "address",
        "name": "host",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "expiration",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isRedeemed",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "topic",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "duration",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface Invite {
  host: string;
  expiration: bigint;
  isRedeemed: boolean;
  topic: string;
  duration: bigint;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function RedeemInvite({ tokenId }: { tokenId: number }) {
  const { isConnected, address } = useAccount();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isFarcasterContext, setIsFarcasterContext] = useState(false);
  const [farcasterConnectedAddress, setFarcasterConnectedAddress] = useState<string | null>(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [showGoogleAuthPrompt, setShowGoogleAuthPrompt] = useState(false);
  const [isOwner, setIsOwner] = useState<boolean | null>(null); // null = loading, true/false = result

  // If client is not ready yet, render a skeleton/loading state
  const [clientReady, setClientReady] = useState(false);
  
  // Set client ready after mount to prevent hydration mismatch
  useEffect(() => {
    setClientReady(true);
  }, []);

  // Verify if the user owns this token
  const { data: tokenOwner, isLoading: isLoadingOwner } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)],
    onSuccess: (data) => {
      console.log(`Owner of token ${tokenId}:`, data);
      if (address && data) {
        const isTokenOwner = (data as string).toLowerCase() === address.toLowerCase();
        console.log(`User ${address} owns token ${tokenId}: ${isTokenOwner}`);
        setIsOwner(isTokenOwner);
      } else {
        setIsOwner(false);
      }
    },
    onError: (error) => {
      console.error(`Error checking ownership of token ${tokenId}:`, error);
      setIsOwner(false);
    },
    enabled: isConnected && tokenId > 0,
  });

  // Check if in Farcaster context
  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        // In frame-sdk v0.0.34, we'll detect Farcaster context differently
        const isFarcaster = 
          typeof window !== 'undefined' && 
          (window.location.href.includes('warpcast') || 
           window.navigator.userAgent.toLowerCase().includes('farcaster'));
        
        if (isFarcaster) {
          setIsFarcasterContext(true);
          // Try to get wallet address from window.frame
          const connectedAddress = typeof window !== 'undefined' ? 
            (window as any).frame?.connectedAddress : null;
          
          if (connectedAddress) {
            setFarcasterConnectedAddress(connectedAddress);
          }
        }
      } catch (error) {
        console.error('Not in a Farcaster Frame context:', error);
        setIsFarcasterContext(false);
      }
    };

    checkFarcasterContext();
  }, []);

  // Fetch invite details
  const { data: inviteData, isLoading: isLoadingInvite } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'invites',
    args: [BigInt(tokenId)],
    onSuccess: (data) => {
      console.log(`Successfully fetched data for token ID ${tokenId}:`, data);
    },
    onError: (error) => {
      console.error(`Error fetching data for token ID ${tokenId}:`, error);
    },
    enabled: tokenId > 0,
  });

  // Parse the invite data into a structured object
  const invite: Invite | undefined = useMemo(() => {
    if (!inviteData) return undefined;
    
    console.log('Raw invite data from contract:', inviteData);
    
    try {
      // Make sure we have data in the expected format
      if (!Array.isArray(inviteData) && typeof inviteData === 'object') {
        // Handle the case where it's returned as an object with numeric keys
        return {
          host: (inviteData as any)[0] || '',
          expiration: (inviteData as any)[1] || BigInt(0),
          isRedeemed: (inviteData as any)[2] || false,
          topic: (inviteData as any)[3] || '',
          duration: (inviteData as any)[4] || BigInt(0),
        };
      } else if (Array.isArray(inviteData)) {
        // Handle the case where it's returned as an array
        return {
          host: inviteData[0] || '',
          expiration: inviteData[1] || BigInt(0),
          isRedeemed: inviteData[2] || false,
          topic: inviteData[3] || '',
          duration: inviteData[4] || BigInt(0),
        };
      } else {
        console.error('Unexpected data format from contract:', inviteData);
        return undefined;
      }
    } catch (error) {
      console.error('Error parsing invite data:', error);
      return undefined;
    }
  }, [inviteData]);

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'redeemInvite',
    args: [BigInt(tokenId)],
    enabled: isConnected && !!invite && !invite.isRedeemed && !!selectedSlot,
  });

  const { write, isSuccess } = useContractWrite(config);

  // Fetch available time slots from the host's Google Calendar
  useEffect(() => {
    if (invite?.host && !invite.isRedeemed) {
      setLoadingSlots(true);
      
      // In a real app, this would be an API call to your backend
      // which would fetch the host's Google Calendar availability
      fetchAvailability(invite.host, Number(invite.duration) / 60);
    }
  }, [invite]);

  // Mock function to fetch calendar availability
  const fetchAvailability = async (hostAddress: string, durationMinutes: number) => {
    try {
      // Simulating an API call to fetch availability from the host's Google Calendar
      setTimeout(() => {
        // Generate next 7 days availability, 3 slots per day
        const slots: TimeSlot[] = [];
        const now = new Date();
        
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(now.getDate() + day + 1); // Start from tomorrow
          
          // Generate 3 time slots for each day
          const hours = [9, 13, 16]; // 9am, 1pm, 4pm
          
          for (const hour of hours) {
            date.setHours(hour, 0, 0, 0);
            
            const start = new Date(date);
            const end = new Date(date);
            end.setMinutes(end.getMinutes() + durationMinutes);
            
            slots.push({
              start: start.toISOString(),
              end: end.toISOString()
            });
          }
        }
        
        setAvailableSlots(slots);
        setLoadingSlots(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setError('Failed to load availability. Please try again.');
      setLoadingSlots(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    // Check if Google Calendar is connected first
    if (!isGoogleCalendarConnected) {
      setShowGoogleAuthPrompt(true);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // In v0.0.34, we'll use a simplified approach without SDK wallet methods
      if (isFarcasterContext) {
        try {
          // In a real app, we would have deeper Farcaster integration
          // For now, use regular web3 flow
          if (write) {
            await write();
            
            // Simulate successful booking
            setTimeout(() => {
              setSuccess('Meeting successfully booked! A calendar invite has been sent to your email.');
              setIsLoading(false);
            }, 1500);
          } else {
            throw new Error('Contract write not ready');
          }
        } catch (error) {
          console.error('Transaction error:', error);
          setError('Failed to send transaction. Please try again.');
          setIsLoading(false);
        }
      } else if (write) {
        // Regular web3 flow
        await write();
        
        // Simulate successful booking
        setTimeout(() => {
          setSuccess('Meeting successfully booked! A calendar invite has been sent to your email.');
          setIsLoading(false);
        }, 1500);
      } else {
        throw new Error('Contract write not ready');
      }
    } catch (err) {
      console.error('Error redeeming invite:', err);
      setError('Failed to book meeting. Please try again.');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Add this function to handle Google Calendar connection
  const connectGoogleCalendar = () => {
    // In a real implementation, this would open the Google OAuth flow
    // For this demo, we'll simulate the connection process
    setIsLoading(true);
    
    setTimeout(() => {
      setIsGoogleCalendarConnected(true);
      setShowGoogleAuthPrompt(false);
      setIsLoading(false);
    }, 1500);
  };

  // If client is not ready yet, render a skeleton/loading state
  if (!clientReady) {
    return (
      <div className="w-full max-w-lg mt-8">
        <div className="mb-6">
          <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
          <div className="p-4 bg-gray-800 rounded border border-gray-700 space-y-3">
            <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-2/3 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // In Farcaster context but no wallet connected
  if (isFarcasterContext && !farcasterConnectedAddress && !address) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-accent">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          You need to connect a wallet to book this meeting.
        </p>
        <button
          onClick={() => {
            // Without SDK wallet.connect, show a message to connect wallet
            alert('Please connect your wallet in the Farcaster app');
          }}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isConnected && !isFarcasterContext) return null;
  if (isLoadingInvite || isLoadingOwner) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-400">Loading invite details for token #{tokenId}...</p>
      </div>
    );
  }
  if (!invite) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-3 text-red-500">Invite Not Found</h2>
        <p className="text-gray-400 mb-4">
          We couldn't retrieve the details for invite #{tokenId}.
        </p>
        <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
          <h3 className="text-base font-medium text-accent mb-2">Possible reasons:</h3>
          <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            <li>The token ID #{tokenId} doesn't exist on the contract</li>
            <li>There was an error communicating with the blockchain</li>
            <li>The contract may have been updated or changed</li>
          </ul>
        </div>
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500 rounded text-sm">
          <p className="font-medium text-blue-400">Debug Info:</p>
          <p className="text-gray-400">Contract Address: {CONTRACT_ADDRESS}</p>
          <p className="text-gray-400">Token ID: {tokenId}</p>
          <p className="text-gray-400">Connected Address: {address || "Not connected"}</p>
          <p className="text-gray-400">Owner Status: {isOwner === null ? "Unknown" : isOwner ? "You own this token" : "You don't own this token"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link 
            href="/invites" 
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded text-center transition-colors"
          >
            View My Invites
          </Link>
          <Link 
            href="/" 
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded text-center transition-colors"
          >
            Create New Invite
          </Link>
        </div>
      </div>
    );
  }

  // Format the host address safely with fallback
  const formatAddress = (address: string | undefined): string => {
    if (!address) return 'Unknown';
    try {
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    } catch (e) {
      return address || 'Unknown';
    }
  };

  // Display invite details
  const InviteDetails = () => (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2 text-accent">
        {isOwner === false ? 'Calendar Invite' : 'Booking NFT'}
      </h2>
      <div className="p-4 bg-gray-800 rounded border border-gray-700">
        <p className="text-accent mb-2">
          <span className="font-semibold">Topic:</span> {invite?.topic || 'No topic'}
        </p>
        <p className="text-accent mb-2">
          <span className="font-semibold">Duration:</span> {invite?.duration ? Number(invite.duration) / 60 : '-'} minutes
        </p>
        <p className="text-accent mb-2">
          <span className="font-semibold">From:</span> {formatAddress(invite?.host)}
        </p>
        <p className="text-accent">
          <span className="font-semibold">Valid Until:</span>{' '}
          {invite?.expiration ? new Date(Number(invite.expiration) * 1000).toLocaleDateString() : 'Unknown'}
        </p>
      </div>
    </div>
  );

  // Not owner warning
  if (isOwner === false) {
    return (
      <div className="w-full max-w-lg mt-8">
        <InviteDetails />
        <div className="p-6 bg-yellow-500/10 border border-yellow-500 rounded">
          <h3 className="text-xl font-semibold text-yellow-500 mb-2">Not Your Invite</h3>
          <p className="text-gray-400 mb-4">
            This calendar invite belongs to another wallet address. You can only view its details, 
            but you won't be able to book a meeting with it.
          </p>
          <p className="text-sm text-gray-500">
            If you received this invite, make sure you're connected with the correct wallet address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mt-8">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500 text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500 text-green-500">
          {success}
        </div>
      )}

      {showGoogleAuthPrompt && (
        <div className="mb-4 p-4 rounded bg-blue-500/10 border border-blue-500">
          <h3 className="text-lg font-semibold mb-2 text-accent">Connect Google Calendar</h3>
          <p className="text-sm text-gray-400 mb-4">
            To book this meeting, you need to connect your Google Calendar so we can add the event to your schedule.
          </p>
          <button
            onClick={connectGoogleCalendar}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
          </button>
        </div>
      )}

      <InviteDetails />

      {invite?.isRedeemed ? (
        <div className="mb-4 p-3 rounded bg-blue-500/10 border border-blue-500 text-blue-500">
          This invite has already been redeemed. Check your calendar for the booked meeting.
        </div>
      ) : invite?.expiration && Number(invite.expiration) * 1000 < Date.now() ? (
        <div className="mb-4 p-3 rounded bg-yellow-500/10 border border-yellow-500 text-yellow-500">
          This invite has expired and can no longer be used.
        </div>
      ) : (
        <>
          {!isGoogleCalendarConnected && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-accent font-medium">Google Calendar Not Connected</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    You need to connect your Google Calendar to book this meeting.
                  </p>
                  <button
                    onClick={() => setShowGoogleAuthPrompt(true)}
                    className="mt-2 px-4 py-1 bg-yellow-500/20 text-yellow-500 rounded text-sm hover:bg-yellow-500/30 transition-colors"
                  >
                    Connect Calendar
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-accent">Select a time slot</h3>
            <p className="text-sm text-gray-400 mb-4">
              These times are available on the sender's calendar. Select one to book your meeting.
            </p>
            
            <div className="space-y-2">
              {loadingSlots ? (
                <div className="text-center p-6 bg-gray-800 rounded border border-gray-700">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading available times...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`w-full p-3 rounded text-left ${
                      selectedSlot === slot.start
                        ? 'bg-blue-500/20 border border-blue-500'
                        : 'bg-gray-800 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium text-accent">{formatDate(slot.start)}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center p-4 bg-gray-800 rounded border border-gray-700">
                  <p className="text-gray-400">No available time slots found</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleRedeem}
            disabled={isLoading || !selectedSlot || (!isFarcasterContext && !write)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Booking Meeting...' : 'Book Meeting'}
          </button>
          
          <div className="mt-4 text-center text-xs text-gray-500">
            Booking this meeting will use your NFT and add the event to both calendars.
          </div>
        </>
      )}
    </div>
  );
} 