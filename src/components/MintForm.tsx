'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import { sdk } from '@farcaster/frame-sdk';
import { storeInvite } from '@/lib/supabase';
import { ethers, BrowserProvider, Contract } from 'ethers';

// Updated contract address (soulbound NFT)
const CONTRACT_ADDRESS = '0xD2840522281731c251C81CcCf34Ade528E19DBC9';
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getInviteDetails",
    "outputs": [
      {
        "components": [
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
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct SoulboundCalendarInviteNFT.CalendarInvite",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
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

// Create a client-only wrapper to avoid hydration issues
function ClientOnlyForm({ initialData }: MintFormProps) {
  // Move the entire component logic here
  const [clientReady, setClientReady] = useState(true);
  const { isConnected, address } = useAccount();
  const [formData, setFormData] = useState({
    recipient: initialData?.recipient || '',
    topic: initialData?.topic || '',
    duration: initialData?.duration || 30,
    validDays: 30,
    recipientEmail: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFarcasterUser, setIsFarcasterUser] = useState(false);
  const [farcasterConnectedAddress, setFarcasterConnectedAddress] = useState<string | null>(null);
  const [isGoogleCalendarLinked, setIsGoogleCalendarLinked] = useState(false);
  const [showCalendarLinking, setShowCalendarLinking] = useState(false);
  
  // Add check for contract owner status
  const [isContractOwner, setIsContractOwner] = useState(false);
  
  // Check if the connected wallet is the contract owner
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!address) return;
      
      try {
        // You would typically call a function like owner() on the contract
        // For now, we'll check if the address matches the expected owner
        // This should be replaced with an actual contract call for production use
        const expectedOwner = '0x614220b724070f274D0DBeB3D42ED2804aF488c7'.toLowerCase();
        const isOwner = address.toLowerCase() === expectedOwner;
        setIsContractOwner(isOwner);
        
        // If not owner, show appropriate error
        if (!isOwner) {
          setError('Only the contract owner can mint NFT invites. Please connect with the owner wallet.');
        } else {
          setError('');
        }
      } catch (err) {
        console.error('Error checking owner status:', err);
      }
    };
    
    checkOwnerStatus();
  }, [address]);
  
  // Validate form
  const isFormValid = () => {
    return (
      formData.recipient.trim() !== '' && 
      formData.topic.trim() !== '' && 
      formData.recipientEmail.trim() !== '' &&
      formData.recipientEmail.includes('@') // Basic email validation
    );
  };

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

  // State for transaction status
  const [txHash, setTxHash] = useState<string | null>(null);
  const [minted, setMinted] = useState(false);

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: ABI,
    functionName: 'createInvite',
    args: [
      formData.recipient as `0x${string}`,
      formData.topic,
      BigInt(formData.duration * 60), // Convert minutes to seconds
      BigInt(getExpirationTimestamp()),
      'ipfs://bafkreiagw3c265uutllvcdxe2a3mgboqhyasopwmzpaujcgpmhtj2prdo4' // Valid IPFS metadata URI
    ],
    enabled: isFormValid() && isContractOwner && isConnected && formData.recipient.startsWith('0x'),
  });

  const { write, isLoading: isWagmiLoading, isSuccess, isError, data } = useContractWrite(config);

  // Store successful transaction in localStorage for recovery
  useEffect(() => {
    if (isSuccess && data?.hash) {
      try {
        setTxHash(data.hash);
        // Get existing history or initialize a new one
        const existingHistory = JSON.parse(localStorage.getItem('txHistory') || '[]');
        
        // Add new transaction to history
        const newTx = {
          hash: data.hash,
          recipient: formData.recipient,
          topic: formData.topic,
          recipientEmail: formData.recipientEmail,
          timestamp: Date.now()
        };
        
        const updatedHistory = [newTx, ...existingHistory].slice(0, 20); // Keep only most recent 20
        
        // Save updated history
        localStorage.setItem('txHistory', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error("Failed to update transaction history:", e);
      }
    }
  }, [isSuccess, data]);

  const handleLinkGoogleCalendar = async () => {
    // Mock implementation - would be replaced with actual OAuth flow
    try {
      // In a real app, redirect to Google OAuth consent screen
      alert('In a production app, you would now be redirected to Google OAuth consent screen');
      
      // Mock successful linking
      setIsGoogleCalendarLinked(true);
      localStorage.setItem('googleCalendarLinked', 'true');
      setShowCalendarLinking(false);
    } catch (error) {
      console.error('Error linking calendar:', error);
      setError('Failed to link Google Calendar. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTxHash(null);
    setMinted(false);
    
    try {
      // Validate form data
      if (!isFormValid()) {
        setError('Please fill in all required fields.');
        return;
      }
      
      // Check if recipient address is valid
      if (!formData.recipient.startsWith('0x') || formData.recipient.length !== 42) {
        setError('Invalid recipient wallet address. Please enter a valid Ethereum address.');
        return;
      }

      // Check if user is the contract owner
      if (!isContractOwner) {
        setError('Only the contract owner can create NFT invites. Please connect with the owner wallet.');
        return;
      }
      
      // Use wagmi hooks if available, otherwise fall back to ethers.js
      if (write) {
        write();
      } else {
        // Fall back to manual contract call with ethers.js
        await directContractCall();
      }
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'Error submitting form. Please try again.');
    }
  };
  
  // Direct contract call using ethers.js when wagmi is not working
  const directContractCall = async () => {
    if (!window.ethereum) {
      setError('No Ethereum provider found. Please install MetaMask or another wallet.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Connect to provider
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new Contract(
        CONTRACT_ADDRESS, 
        [
          ...ABI,
          "event InviteCreated(uint256 indexed tokenId, address indexed host, address indexed recipient)"
        ], 
        signer
      );
      
      // Set up event listener for InviteCreated event
      contract.on("InviteCreated", async (tokenId, host, recipient, event) => {
        console.log("InviteCreated event detected:", { tokenId: tokenId.toString(), host, recipient });
        
        // Store invite in Supabase with the tokenId from the event
        try {
          // Create the invite data object to store
          const inviteData = {
            token_id: tokenId.toString(),
            sender_address: address || '',
            recipient_address: formData.recipient,
            recipient_email: formData.recipientEmail,
            topic: formData.topic,
            duration: formData.duration,
            expiration: getExpirationTimestamp(),
            is_redeemed: false,
            transaction_hash: event.transactionHash
          };
          
          console.log("Full invite data being sent to Supabase:", inviteData);
          
          // Store in Supabase
          const storeResult = await storeInvite(inviteData);
          
          console.log("Successfully stored invite in Supabase with token ID from event. Result:", storeResult);
          
          // Reset form on success
          setFormData({
            recipient: '',
            topic: '',
            duration: 30,
            validDays: 30,
            recipientEmail: '',
          });
          
          // Redirect to invites page with transaction hash
          window.location.href = `/invites?tx=${event.transactionHash}`;
        } catch (storeError) {
          console.error("Failed to store invite in database:", storeError);
          setError(`NFT minted successfully, but there was an error saving to database: ${storeError.message}`);
          
          // Even if database storage fails, still redirect to invites page
          setTimeout(() => {
            window.location.href = `/invites?tx=${event.transactionHash}`;
          }, 2000);
        }
        
        // Remove the event listener to prevent duplicates
        contract.off("InviteCreated");
      });
      
      // Convert duration from minutes to seconds
      const durationSeconds = formData.duration * 60;
      
      // Get expiration timestamp
      const expirationTimestamp = getExpirationTimestamp();
      
      // Estimate gas (ethers v6 syntax)
      const gasEstimate = await contract.createInvite.estimateGas(
        formData.recipient,
        formData.topic,
        durationSeconds,
        expirationTimestamp,
        'ipfs://bafkreiagw3c265uutllvcdxe2a3mgboqhyasopwmzpaujcgpmhtj2prdo4'
      ).catch(error => {
        console.error("Gas estimation failed:", error);
        return BigInt(500000); // Default if estimation fails
      });
      
      // Execute transaction
      const tx = await contract.createInvite(
        formData.recipient,
        formData.topic,
        durationSeconds,
        expirationTimestamp,
        'ipfs://bafkreiagw3c265uutllvcdxe2a3mgboqhyasopwmzpaujcgpmhtj2prdo4',
        { 
          gasLimit: gasEstimate * BigInt(15) / BigInt(10) // Add 50% buffer
        }
      );

      console.log("Transaction sent:", tx.hash);
      
      // Save tx hash to state for displaying link
      setTxHash(tx.hash);
      setMinted(true);
      
      // Store transaction in localStorage regardless of database success
      try {
        // Get existing history or initialize a new one
        const existingHistory = JSON.parse(localStorage.getItem('txHistory') || '[]');
        
        // Add new transaction to history
        const newTx = {
          hash: tx.hash,
          recipient: formData.recipient,
          topic: formData.topic,
          recipientEmail: formData.recipientEmail,
          timestamp: Date.now()
        };
        
        const updatedHistory = [newTx, ...existingHistory].slice(0, 20);
        localStorage.setItem('txHistory', JSON.stringify(updatedHistory));
      } catch (historyError) {
        console.error("Failed to update transaction history:", historyError);
      }
      
      // Add a timeout to remove the event listener if the event doesn't fire
      setTimeout(() => {
        contract.off("InviteCreated");
        
        // If we reach this timeout without the event firing, we'll use a fallback approach
        console.log("Timeout reached for InviteCreated event, using fallback to store invite");
        
        // Try to store invite with a temporary tokenId
        const fallbackTokenId = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
        const fallbackInviteData = {
          token_id: fallbackTokenId.toString(),
          sender_address: address || '',
          recipient_address: formData.recipient,
          recipient_email: formData.recipientEmail,
          topic: formData.topic,
          duration: formData.duration,
          expiration: expirationTimestamp,
          is_redeemed: false,
          transaction_hash: tx.hash
        };
        
        storeInvite(fallbackInviteData)
          .then(() => {
            console.log("Stored invite with fallback tokenId:", fallbackTokenId);
            window.location.href = `/invites?tx=${tx.hash}`;
          })
          .catch((err) => {
            console.error("Failed to store invite with fallback tokenId:", err);
            window.location.href = `/invites?tx=${tx.hash}`;
          });
      }, 30000); // 30 second timeout
      
    } catch (error: any) {
      console.error("Contract interaction error:", error);
      setError(error.message || "Failed to mint NFT invite");
    } finally {
      setIsLoading(false);
    }
  };

  // Component to show successful transaction
  const TransactionSuccess = () => {
    if (!txHash) return null;
    
    return (
      <div className="mt-4 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
        <p className="font-medium">NFT minted successfully!</p>
        <a 
          href={`https://sepolia.basescan.org/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          View on Base Sepolia Explorer
        </a>
        <p className="mt-2 text-sm">
          The NFT Calendar Invite has been sent to the recipient's wallet.
        </p>
      </div>
    );
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
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-8 text-accent">Generate Invite NFT</h2>
      <p className="mb-6 text-gray-400">
        Create an invite NFT that gives the receiver exclusive access to book time on your calendar.
      </p>
      
      {isGoogleCalendarLinked && (
        <div className="mb-6 bg-green-500/10 border border-green-500 rounded-lg p-3 flex items-center">
          <svg className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-500">Calendar Connected</span>
        </div>
      )}
      
      {showCalendarLinking && !isGoogleCalendarLinked && (
        <div className="mb-6 p-6 bg-blue-500/10 border border-blue-500 rounded-lg">
          <h3 className="text-lg font-medium mb-4 text-accent">Link your Google Calendar</h3>
          <p className="mb-4 text-gray-400">
            To use this feature, you need to link your Google Calendar account. This allows recipients to book time on your calendar when they redeem the invite.
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            onClick={handleLinkGoogleCalendar}
            disabled={isLoading}
          >
            {isLoading ? 'Linking...' : 'Link Google Calendar'}
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium mb-1 text-white">
            Recipient Address <span className="text-red-500">*</span>
          </label>
          <input
            id="recipient"
            type="text"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="recipientEmail" className="block text-sm font-medium mb-1 text-white">
            Recipient Email <span className="text-red-500">*</span>
          </label>
          <input
            id="recipientEmail"
            type="email"
            value={formData.recipientEmail}
            onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
            placeholder="recipient@example.com"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            required
          />
          <p className="text-sm text-gray-300 mt-1">
            Email is required for sending calendar notifications
          </p>
        </div>
        
        <div>
          <label htmlFor="topic" className="block text-sm font-medium mb-1 text-white">
            Meeting Topic <span className="text-red-500">*</span>
          </label>
          <input
            id="topic"
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="Discuss project collaboration"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium mb-1 text-white">
            Meeting Duration <span className="text-red-500">*</span>
          </label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
          >
            <option value="15" className="bg-gray-800 text-white">15 minutes</option>
            <option value="30" className="bg-gray-800 text-white">30 minutes</option>
            <option value="45" className="bg-gray-800 text-white">45 minutes</option>
            <option value="60" className="bg-gray-800 text-white">1 hour</option>
            <option value="90" className="bg-gray-800 text-white">1.5 hours</option>
            <option value="120" className="bg-gray-800 text-white">2 hours</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="validDays" className="block text-sm font-medium mb-1 text-white">
            Valid For (Days) <span className="text-red-500">*</span>
          </label>
          <select
            id="validDays"
            value={formData.validDays}
            onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
          >
            <option value="7" className="bg-gray-800 text-white">7 days</option>
            <option value="14" className="bg-gray-800 text-white">14 days</option>
            <option value="30" className="bg-gray-800 text-white">30 days</option>
            <option value="60" className="bg-gray-800 text-white">60 days</option>
            <option value="90" className="bg-gray-800 text-white">90 days</option>
          </select>
        </div>
        
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-white text-sm font-medium">
            {error}
            {error.includes('Direct contract call failed: undefined') && (
              <div className="mt-2 text-yellow-300">
                Your transaction may have been sent successfully despite this error.
                Check <a href="https://sepolia.basescan.org/" target="_blank" rel="noopener noreferrer" className="underline">Base Sepolia Explorer</a> with your wallet address to confirm.
              </div>
            )}
            {error.includes('Unknown error') && (
              <div className="mt-2 text-yellow-300">
                Your transaction may have been sent successfully despite this error.
                Check <a href="https://sepolia.basescan.org/" target="_blank" rel="noopener noreferrer" className="underline">Base Sepolia Explorer</a> with your wallet address to confirm.
              </div>
            )}
            {error.includes('Transaction sent but encountered an error') && (
              <div className="mt-2 text-green-300">
                Transaction hash: {error.split(':')[1]?.trim()}
                <div className="mt-1">
                  <a 
                    href={`https://sepolia.basescan.org/tx/${error.split(':')[1]?.trim()}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="underline hover:text-blue-300"
                  >
                    View on Basescan
                  </a>
                </div>
              </div>
            )}
            <div className="mt-2">
              <a href="/debug" className="text-blue-300 hover:underline font-medium">
                → Troubleshoot generation issues
              </a>
            </div>
          </div>
        )}
        
        {isSuccess && (
          <TransactionSuccess />
        )}
        
        <div className="pt-4">
          {!isConnected ? (
            <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg text-center mb-4">
              <p className="text-blue-400 mb-2">Connect your wallet to mint NFT invites</p>
            </div>
          ) : (
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-medium ${
                isFormValid() && !isLoading 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Invite NFT'}
            </button>
          )}
        </div>
        
        {!isGoogleCalendarLinked && !showCalendarLinking && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowCalendarLinking(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Link Google Calendar to enable NFT invites
            </button>
          </div>
        )}
      </form>
      
      <div className="mt-12 pt-8 border-t border-gray-700">
        <h3 className="text-lg font-medium mb-4 text-accent">How it works:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-400">
          <li>You generate an invite NFT for a specific recipient</li>
          <li>The NFT is sent to their wallet</li>
          <li>Only that recipient can use the NFT to book time on your calendar</li>
          <li>They'll select a time based on your Google Calendar availability</li>
          <li>Once booked, both calendars are automatically updated</li>
        </ol>
      </div>
    </div>
  );
}

// Main component as a thin wrapper
export default function MintForm(props: MintFormProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    // Server-side or during hydration, return a minimal placeholder
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
  
  // Client-side, render the full component
  return <ClientOnlyForm {...props} />;
} 