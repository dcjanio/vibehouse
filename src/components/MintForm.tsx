'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { sdk } from '@farcaster/frame-sdk';

// Using the deployed testnet contract address
const CONTRACT_ADDRESS = '0x12d23ebdA380859087b441C9De907ce00bD58662';
const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
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
      },
      {
        "internalType": "uint256",
        "name": "expiration",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "tokenURI",
        "type": "string"
      }
    ],
    "name": "createInvite",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

interface MintFormProps {
  initialData?: {
    recipient?: string;
    topic?: string;
    duration?: number;
  };
}

export default function MintForm({ initialData }: MintFormProps) {
  // Add clientReady state to prevent hydration mismatch
  const [clientReady, setClientReady] = useState(false);
  const { isConnected, address } = useAccount();
  const [formData, setFormData] = useState({
    recipient: '',
    topic: '',
    duration: 30,
    validDays: 30, // How many days the invite is valid for
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFarcasterUser, setIsFarcasterUser] = useState(false);
  const [farcasterConnectedAddress, setFarcasterConnectedAddress] = useState<string | null>(null);
  const [isGoogleCalendarLinked, setIsGoogleCalendarLinked] = useState(false);
  const [showCalendarLinking, setShowCalendarLinking] = useState(false);

  // Set client ready after mount to prevent hydration mismatch
  useEffect(() => {
    setClientReady(true);
  }, []);
  
  // Apply initial data if provided (from Farcaster Frame)
  useEffect(() => {
    if (initialData) {
      const newFormData = { ...formData };
      if (initialData.recipient) newFormData.recipient = initialData.recipient;
      if (initialData.topic) newFormData.topic = initialData.topic;
      if (initialData.duration) newFormData.duration = initialData.duration;
      setFormData(newFormData);
    }
  }, [initialData]);

  // Check if this is being viewed in a Farcaster client
  useEffect(() => {
    const checkFarcasterContext = async () => {
      try {
        // In frame-sdk v0.0.34, we'll detect Farcaster context differently
        const isFarcaster = 
          typeof window !== 'undefined' && 
          (window.location.href.includes('warpcast') || 
           window.navigator.userAgent.toLowerCase().includes('farcaster'));
        
        if (isFarcaster) {
          setIsFarcasterUser(true);
          // Try to get wallet address from window.frame
          const connectedAddress = typeof window !== 'undefined' ? 
            (window as any).frame?.connectedAddress : null;
          
          if (connectedAddress) {
            setFarcasterConnectedAddress(connectedAddress);
          }
        }
      } catch (error) {
        console.error('Not in a Farcaster Frame context:', error);
        setIsFarcasterUser(false);
      }
    };

    checkFarcasterContext();
    
    // Mock checking if Google Calendar is already linked
    // In a real app, this would check with your backend
    const checkCalendarLinked = async () => {
      // Mock implementation - would be replaced with actual API call
      try {
        // Simulating an API call to check if the user has linked their Google Calendar
        setTimeout(() => {
          setIsGoogleCalendarLinked(localStorage.getItem('googleCalendarLinked') === 'true');
        }, 500);
      } catch (error) {
        console.error('Error checking calendar link:', error);
      }
    };
    
    checkCalendarLinked();
  }, []);

  // Calculate expiration date (30 days from now by default)
  const getExpirationTimestamp = () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + formData.validDays);
    return Math.floor(expirationDate.getTime() / 1000);
  };

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'createInvite',
    args: [
      formData.recipient as `0x${string}`,
      formData.topic,
      BigInt(formData.duration * 60), // Convert minutes to seconds
      BigInt(getExpirationTimestamp()),
      'ipfs://...' // TODO: Add IPFS metadata URI
    ],
    enabled: clientReady && isConnected && formData.recipient !== '' && formData.topic !== '' && isGoogleCalendarLinked,
  });

  const { write, isSuccess, isError } = useContractWrite(config);

  const handleLinkGoogleCalendar = async () => {
    // In a real application, this would redirect to Google OAuth
    // For demo purposes, we'll just simulate the linking process
    setIsLoading(true);
    
    try {
      // Simulating OAuth flow
      setTimeout(() => {
        setIsGoogleCalendarLinked(true);
        localStorage.setItem('googleCalendarLinked', 'true');
        setIsLoading(false);
        setShowCalendarLinking(false);
      }, 1500);
    } catch (error) {
      console.error('Error linking calendar:', error);
      setError('Failed to link Google Calendar. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isGoogleCalendarLinked) {
      setShowCalendarLinking(true);
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      if (!write) {
        throw new Error('Contract write not ready');
      }

      // If in Farcaster, use a simplified flow without the SDK
      if (isFarcasterUser) {
        try {
          // In a real app, we would have a deeper Farcaster integration
          // For now, we'll use the standard web3 flow
          await write();
          // Show success message
          setIsLoading(false);
        } catch (error) {
          console.error('Transaction error:', error);
          setError('Failed to send transaction. Please try again.');
          setIsLoading(false);
        }
      } else {
        // Regular web3 flow
        await write();
      }
    } catch (err) {
      console.error('Error minting NFT:', err);
      setError('Failed to mint invite NFT. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If client is not ready yet, render a skeleton/loading state to prevent hydration errors
  if (!clientReady) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <div className="h-6 w-48 bg-gray-700 rounded animate-pulse mb-6"></div>
        <div className="h-4 w-full bg-gray-700 rounded animate-pulse mb-8"></div>
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-full bg-gray-700 rounded animate-pulse mt-6"></div>
        </div>
      </div>
    );
  }

  // In Farcaster app and no wallet connected
  if (isFarcasterUser && !farcasterConnectedAddress && !address) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-accent">Connect Your Wallet</h2>
        <p className="text-gray-400 mb-6">
          You need to connect a wallet to send calendar invites.
        </p>
        <button
          onClick={() => {
            // Without SDK.wallet.connect, we show a message to connect wallet
            alert('Please connect your wallet in the Farcaster app');
          }}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // In web app and not connected
  if (!isConnected && !isFarcasterUser) return null;
  
  // Show Google Calendar linking UI if needed
  if (showCalendarLinking) {
    return (
      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-accent">Link Your Calendar</h2>
        <p className="text-gray-400 mb-6">
          To send an invite, you need to link your Google Calendar so recipients can see your availability.
        </p>
        <button
          onClick={handleLinkGoogleCalendar}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Linking...' : 'Link Google Calendar'}
        </button>
        <button
          onClick={() => setShowCalendarLinking(false)}
          className="w-full bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mt-8">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500 text-red-500">
          {error}
        </div>
      )}
      {isSuccess && (
        <div className="mb-4 p-3 rounded bg-green-500/10 border border-green-500 text-green-500">
          <p className="mb-2">Successfully sent calendar invite!</p>
          <p className="text-sm">The NFT has been sent to the recipient's wallet.</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-accent">Generate Invite NFT</h2>
          {isGoogleCalendarLinked ? (
            <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500 text-green-500 text-xs flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Calendar Connected
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCalendarLinking(true)}
              className="text-sm text-blue-400 hover:underline"
            >
              Link Calendar
            </button>
          )}
        </div>
        <p className="text-sm text-gray-400 mt-2 mb-4">
          Create an invite NFT that gives the receiver exclusive access to book time on your calendar.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="recipient" className="block text-accent mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          id="recipient"
          value={formData.recipient}
          onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-accent border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="0x..."
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="topic" className="block text-accent mb-2">
          Meeting Topic
        </label>
        <input
          type="text"
          id="topic"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-accent border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="Discuss Project"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="duration" className="block text-accent mb-2">
          Meeting Duration
        </label>
        <select
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          className="w-full p-2 rounded bg-gray-800 text-accent border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="validDays" className="block text-accent mb-2">
          Valid For (Days)
        </label>
        <select
          id="validDays"
          value={formData.validDays}
          onChange={(e) => setFormData({ ...formData, validDays: Number(e.target.value) })}
          className="w-full p-2 rounded bg-gray-800 text-accent border border-gray-700 focus:border-blue-500 focus:outline-none"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading || !isGoogleCalendarLinked || !write}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Generating...' : 'Generate Invite NFT'}
      </button>

      <div className="mt-6 p-4 bg-gray-800 rounded border border-gray-700">
        <h3 className="text-accent font-medium mb-2">How it works:</h3>
        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-1">
          <li>You generate an invite NFT for a specific recipient</li>
          <li>The NFT is sent to their wallet</li>
          <li>Only that recipient can use the NFT to book time on your calendar</li>
          <li>They'll select a time based on your Google Calendar availability</li>
          <li>Once booked, both calendars are automatically updated</li>
        </ol>
      </div>
    </form>
  );
} 