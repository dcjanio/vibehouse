'use client';

import { useState, useEffect } from 'react';
import { useAccount, useNetwork, usePrepareContractWrite, useContractWrite } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link';
import { ethers, BrowserProvider, Contract } from 'ethers';
import NoSSR from '../no-ssr';
import { storeInvite } from '@/lib/supabase';

// Use the same contract configuration as in MintForm
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

// Same chain configuration as in the main app
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
  appName: 'NFT Calendar Debug',
  projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function DebugContent() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [formData, setFormData] = useState({
    recipient: '0x7C5361F5BB5e2Bb123C95e69BEd331f3b0b8f094',
    topic: 'Test Meeting',
    duration: 30,
    validDays: 30,
  });
  const [error, setError] = useState('');
  const [callResult, setCallResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientIsConnected, setClientIsConnected] = useState(false);
  const [clientChain, setClientChain] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [success, setSuccess] = useState<React.ReactNode | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Add a manual contract interaction function that bypasses the wagmi hooks
  const directContractCall = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (!window.ethereum) {
        throw new Error("No Ethereum provider detected");
      }
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const network = await provider.getNetwork();
      if (network.chainId !== 84532n) {
        throw new Error("Please connect to Base Sepolia network");
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
            topic: formData.topic,
            duration: parseInt(formData.duration),
            expiration: Math.floor(Date.now() / 1000) + parseInt(formData.duration) * 24 * 60 * 60,
            is_redeemed: false,
            transaction_hash: event.transactionHash
          };
          
          await storeInvite(inviteData);
          console.log("Invite saved to Supabase with tokenId:", inviteData);
          
          // Update the success message with tokenId information
          setSuccess(
            <>
              Transaction sent! Hash: {event.transactionHash}<br/>
              Token ID: {tokenId.toString()}<br/>
              <a 
                href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Base Sepolia Explorer
              </a>
            </>
          );
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
        formData.duration * 60,
        Math.floor(Date.now() / 1000) + formData.validDays * 24 * 60 * 60,
        'ipfs://bafkreiagw3c265uutllvcdxe2a3mgboqhyasopwmzpaujcgpmhtj2prdo4'
      );
      
      console.log("Transaction:", tx);
      
      // Add transaction to history without waiting for event
      const newTransaction = {
        hash: tx.hash,
        timestamp: Date.now(),
        recipient: formData.recipient,
        topic: formData.topic,
        duration: formData.duration
      };
      
      const history = JSON.parse(localStorage.getItem('txHistory') || '[]');
      history.unshift(newTransaction);
      localStorage.setItem('txHistory', JSON.stringify(history));
      
      setTxHistory(history);
      setSuccess(`Transaction sent! Hash: ${tx.hash} (Waiting for blockchain confirmation...)`);
      
      // Reset form after successful submission
      setFormData({
        recipient: '',
        topic: '',
        duration: 30,
        validDays: 30
      });
      
      // Add a timeout to remove the event listener if the event doesn't fire
      setTimeout(() => {
        contract.off("InviteCreated");
      }, 30000); // 30 seconds timeout
      
    } catch (err: any) {
      console.error("Contract call failed:", err);
      setError(`Contract call failed: ${err.message || 'Unknown error'}`);
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
    
    // Convert ms to seconds if it's in milliseconds
    const seconds = timestamp > 1000000000000 ? Math.floor(timestamp / 1000) : timestamp;
    
    const date = new Date(seconds * 1000);
    return date.toLocaleString();
  };

  // Only render the full content if we've hydrated to prevent mismatch
  if (!hydrated) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h2 className="text-xl font-semibold text-indigo-800 mb-2">🌟 Try Our Improved Experience!</h2>
        <p className="mb-4">Having issues with this debug page? We've created a more stable experience:</p>
        <Link 
          href="/fresh-debug" 
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition duration-150 ease-in-out"
        >
          Go to Hydration-Safe Debug Page
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">NFT Calendar Invite Debug</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Wallet Connection</h2>
        <div className="mb-4">
          <ConnectButton />
        </div>
        <div className="bg-gray-100 p-4 rounded mb-4">
          <p><strong>Connected:</strong> {clientIsConnected ? 'Yes' : 'No'}</p>
          <p><strong>Address:</strong> {address || 'Not connected'}</p>
          <p><strong>Chain:</strong> {clientChain?.name || 'Unknown'}</p>
          <p><strong>Chain ID:</strong> {clientChain?.id || 'Unknown'}</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Contract Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Contract Address:</strong> {CONTRACT_ADDRESS}</p>
          <p>
            <a 
              href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View on Base Sepolia Explorer
            </a>
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Direct Contract Call</h2>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recipient">
              Recipient Address
            </label>
            <input
              id="recipient"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              placeholder="0x..."
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="topic">
              Meeting Topic
            </label>
            <input
              id="topic"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.topic}
              onChange={(e) => setFormData({...formData, topic: e.target.value})}
              placeholder="Topic"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duration">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 30})}
              min="15"
              max="120"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="validDays">
              Valid For (days)
            </label>
            <input
              id="validDays"
              type="number"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.validDays}
              onChange={(e) => setFormData({...formData, validDays: parseInt(e.target.value) || 30})}
              min="1"
              max="365"
            />
          </div>
          
          <div className="mb-6">
            <p><strong>Expiration:</strong> {formatTimestamp(getExpirationTimestamp())}</p>
          </div>
          
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded border border-green-200">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded border border-red-200">
              {error}
            </div>
          )}

          {callResult && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded">
              <p><strong>Result:</strong> {callResult}</p>
            </div>
          )}

          {info && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded">
              <p>{info}</p>
            </div>
          )}
          
          <button
            onClick={directContractCall}
            disabled={isLoading || !clientIsConnected}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              (isLoading || !clientIsConnected) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Sending...' : 'Create NFT Invite'}
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        {txHistory.length > 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <ul className="divide-y divide-gray-200">
              {txHistory.map((tx, index) => (
                <li key={index} className="py-4">
                  <p className="font-medium">Tx Hash: 
                    <a 
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 ml-2 hover:underline"
                    >
                      {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                    </a>
                  </p>
                  <p>Recipient: {tx.recipient}</p>
                  <p>Topic: {tx.topic}</p>
                  <p>Time: {new Date(tx.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <NoSSR>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <DebugContent />
        </RainbowKitProvider>
      </WagmiConfig>
    </NoSSR>
  );
} 