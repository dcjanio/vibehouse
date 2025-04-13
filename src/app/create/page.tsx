'use client';

import { useState, useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link';
import { ethers, BrowserProvider, Contract } from 'ethers';
import NoSSR from '../no-ssr';
import { storeInvite } from '@/lib/supabase';

// Contract configuration
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
  }
];

// Chain configuration
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
    default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const { chains, publicClient } = configureChains(
  [baseSepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'NFT Calendar Invite',
  projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function CreateInviteContent() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [formData, setFormData] = useState({
    recipient: '',
    topic: '',
    duration: 30,
    validDays: 30,
    recipientEmail: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientIsConnected, setClientIsConnected] = useState(false);
  const [clientChain, setClientChain] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [success, setSuccess] = useState<React.ReactNode | null>(null);

  // Contract interaction function
  const createInvite = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider detected. Please install MetaMask.");
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 84532n) {
        throw new Error("Please connect to Base Sepolia network");
      }
      
      // Validate recipient email
      if (!formData.recipientEmail || !formData.recipientEmail.includes('@')) {
        throw new Error("Please enter a valid recipient email");
      }
      
      const contract = new Contract(
        CONTRACT_ADDRESS,
        [
          "function createInvite(address recipient, string memory topic, uint256 duration, uint256 expiration, string memory tokenURI) external returns (uint256)",
          "function ownerOf(uint256 tokenId) external view returns (address)",
          "function tokenURI(uint256 tokenId) external view returns (string memory)",
          "event InviteCreated(uint256 indexed tokenId, address indexed host, address indexed recipient)"
        ],
        signer
      );
      
      // Create a listener for the InviteCreated event
      contract.on("InviteCreated", async (tokenId, host, recipient, event) => {
        console.log("InviteCreated event detected:", { tokenId, host, recipient });
        
        const senderAddress = await signer.getAddress();
        
        // Store invite in Supabase with the tokenId from the event
        try {
          const inviteData = {
            token_id: tokenId.toString(),
            sender_address: senderAddress,
            recipient_address: formData.recipient,
            recipient_email: formData.recipientEmail,
            topic: formData.topic,
            duration: parseInt(formData.duration.toString()),
            expiration: Math.floor(Date.now() / 1000) + parseInt(formData.validDays.toString()) * 24 * 60 * 60,
            is_redeemed: false,
            transaction_hash: event.transactionHash
          };
          
          await storeInvite(inviteData);
          console.log("Invite saved to Supabase with tokenId:", inviteData);
          
          // Update the success message with tokenId information
          setSuccess(
            <>
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Invite Created Successfully!</span>
              </div>
              <p className="mb-2">NFT has been minted and the invite has been created.</p>
              <p className="mb-1"><span className="font-medium">Token ID:</span> {tokenId.toString()}</p>
              <p className="mb-1"><span className="font-medium">Recipient:</span> {formData.recipient}</p>
              <p className="mb-1"><span className="font-medium">Email:</span> {formData.recipientEmail}</p>
              <p className="mb-3"><span className="font-medium">Topic:</span> {formData.topic}</p>
              <a 
                href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Base Sepolia Explorer
              </a>
            </>
          );
          
          // Reset form after success
          setFormData({
            recipient: '',
            topic: '',
            duration: 30,
            validDays: 30,
            recipientEmail: '',
          });
        } catch (supabaseError) {
          console.error("Failed to store invite in Supabase:", supabaseError);
          // Continue execution even if Supabase storage fails
        }
        
        // Remove the event listener after processing to avoid duplicates
        contract.off("InviteCreated");
      });
      
      // Call the createInvite function
      const tx = await contract.createInvite(
        formData.recipient,
        formData.topic,
        formData.duration * 60, // convert minutes to seconds
        Math.floor(Date.now() / 1000) + formData.validDays * 24 * 60 * 60,
        'ipfs://bafkreiagw3c265uutllvcdxe2a3mgboqhyasopwmzpaujcgpmhtj2prdo4'
      );
      
      console.log("Transaction:", tx);
      
      // Add transaction to history
      const newTransaction = {
        hash: tx.hash,
        timestamp: Date.now(),
        recipient: formData.recipient,
        recipientEmail: formData.recipientEmail,
        topic: formData.topic,
        duration: formData.duration
      };
      
      const history = JSON.parse(localStorage.getItem('txHistory') || '[]');
      history.unshift(newTransaction);
      localStorage.setItem('txHistory', JSON.stringify(history));
      
      setTxHistory(history);
      setSuccess(
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Transaction sent! Waiting for blockchain confirmation...</span>
        </div>
      );
      
      // Add a timeout to remove the event listener if the event doesn't fire
      setTimeout(() => {
        contract.off("InviteCreated");
      }, 30000); // 30 seconds timeout
      
    } catch (err: any) {
      console.error("Contract call failed:", err);
      setError(`${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Use useEffect to update client-side state for hydration safety
  useEffect(() => {
    setClientIsConnected(isConnected);
    setClientChain(chain);
    setHydrated(true);
    
    // Load transaction history from localStorage
    try {
      const storedHistory = localStorage.getItem('txHistory');
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        setTxHistory(history);
      }
    } catch (e) {
      console.error("Failed to load transaction history:", e);
    }
  }, [isConnected, chain]);

  // Calculate expiration timestamp (current time + valid days)
  const getExpirationTimestamp = () => {
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const validSeconds = formData.validDays * 24 * 60 * 60; // days to seconds
    return now + validSeconds;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const seconds = timestamp > 1000000000000 ? Math.floor(timestamp / 1000) : timestamp;
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
  };

  // Only render the full content if we've hydrated to prevent mismatch
  if (!hydrated) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-700 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* Header with Connect Button */}
      <header className="w-full px-4 py-4 bg-gray-800 bg-opacity-50 backdrop-blur-lg z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-blue-400">NFT Calendar Invites</div>
          <div className="flex items-center space-x-4">
            {clientIsConnected ? (
              <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1 text-sm">
                <span className="text-green-400">Connected:</span>
                <span className="text-gray-300 truncate max-w-[120px] md:max-w-[200px]">{address}</span>
              </div>
            ) : null}
            <ConnectButton />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-bold text-blue-400">Create NFT Invite</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Back to Home
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 text-blue-300">Create New Calendar Invite NFT</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="recipient">
                    Recipient Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="recipient"
                    type="text"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    value={formData.recipient}
                    onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                    placeholder="0x..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="recipientEmail">
                    Recipient Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="recipientEmail"
                    type="email"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                    placeholder="recipient@example.com"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-400">Email is required for sending calendar notifications</p>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="topic">
                    Meeting Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="topic"
                    type="text"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    placeholder="Discuss project collaboration"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="duration">
                      Meeting Duration <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    >
                      <option value="15" className="bg-gray-700">15 minutes</option>
                      <option value="30" className="bg-gray-700">30 minutes</option>
                      <option value="45" className="bg-gray-700">45 minutes</option>
                      <option value="60" className="bg-gray-700">1 hour</option>
                      <option value="90" className="bg-gray-700">1.5 hours</option>
                      <option value="120" className="bg-gray-700">2 hours</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="validDays">
                      Valid For <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="validDays"
                      value={formData.validDays}
                      onChange={(e) => setFormData({...formData, validDays: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-white"
                    >
                      <option value="7" className="bg-gray-700">7 days</option>
                      <option value="14" className="bg-gray-700">14 days</option>
                      <option value="30" className="bg-gray-700">30 days</option>
                      <option value="60" className="bg-gray-700">60 days</option>
                      <option value="90" className="bg-gray-700">90 days</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-2">
                  <p className="text-gray-300">
                    <span className="font-medium">Expiration:</span> {formatTimestamp(getExpirationTimestamp())}
                  </p>
                </div>
                
                {success && (
                  <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-300">
                    {success}
                  </div>
                )}
                
                {error && (
                  <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
                    <div className="flex items-center mb-1">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Error</span>
                    </div>
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="pt-4">
                  <button
                    onClick={createInvite}
                    disabled={isLoading || !clientIsConnected || !formData.recipient || !formData.topic || !formData.recipientEmail}
                    className={`w-full py-3 px-6 ${
                      isLoading || !clientIsConnected || !formData.recipient || !formData.topic || !formData.recipientEmail
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } rounded-lg font-medium transition-colors shadow-lg`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </div>
                    ) : 'Create NFT Invite'}
                  </button>
                </div>
              </div>
            </div>
            
            {txHistory.length > 0 && (
              <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-blue-300">Recent Transactions</h2>
                <div className="divide-y divide-gray-700">
                  {txHistory.slice(0, 5).map((tx, index) => (
                    <div key={index} className="py-3">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-300">{tx.topic}</span>
                        <span className="text-gray-400 text-sm">{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-400 mt-1 text-sm">Recipient: {tx.recipient}</p>
                      <a 
                        href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm inline-block mt-1"
                      >
                        View transaction
                      </a>
                    </div>
                  ))}
                </div>
                {txHistory.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/invites" className="text-blue-400 hover:text-blue-300 text-sm">
                      View all transactions
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 text-blue-300">How It Works</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">1.</span> 
                  Create an NFT invite for a specific recipient
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">2.</span> 
                  The NFT is sent to their wallet address
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">3.</span> 
                  They'll receive email notification
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">4.</span> 
                  They can redeem the NFT to book time on your calendar
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2">5.</span> 
                  Each NFT is soulbound and can only be used once
                </li>
              </ul>
              
              <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="font-medium text-blue-300 mb-2">Contract Info</h3>
                <p className="text-sm text-gray-400 mb-2">
                  NFT invites are created on the Base Sepolia network
                </p>
                <a 
                  href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View contract
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <NoSSR>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <CreateInviteContent />
        </RainbowKitProvider>
      </WagmiConfig>
    </NoSSR>
  );
} 