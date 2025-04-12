'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractReads } from 'wagmi';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { publicProvider } from 'wagmi/providers/public';
import RedeemInvite from '@/components/RedeemInvite';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link';
import ManualTokenInput from '@/components/ManualTokenInput';

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
    public: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || ''] },
    default: { http: [process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || ''] },
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

// Using the deployed testnet contract address
const CONTRACT_ADDRESS = '0x12d23ebdA380859087b441C9De907ce00bD58662';
const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenOfOwnerByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "tokenByIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Interface for invite data
interface InviteData {
  id: number;
  topic: string;
  sender: string;
  expiration: bigint;
  isRedeemed: boolean;
  duration: bigint;
}

// Main page component
export default function InvitesPage() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <InvitesContent />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

// Inner component that uses wagmi hooks
function InvitesContent() {
  const [clientReady, setClientReady] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<number | null>(null);
  const [invites, setInvites] = useState<InviteData[]>([]);
  const [tokenIds, setTokenIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useAccount();

  // Set client ready after mount to prevent hydration mismatch
  useEffect(() => {
    setClientReady(true);
  }, []);

  // Find tokens by querying total supply and scanning each token
  useEffect(() => {
    const fetchAllTokens = async () => {
      if (!clientReady) return;
      
      setLoading(true);
      console.log('Fetching all tokens from contract...');
      
      try {
        // First get the total supply
        const totalSupply = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: ABI,
          functionName: 'totalSupply',
        });
        
        console.log(`Total supply: ${totalSupply}`);
        
        // This will store all tokens we find
        const foundTokens: number[] = [];
        const maxBatchSize = 10; // Process in batches to avoid rate limiting
        
        // If user is connected, find only their tokens
        if (isConnected && address) {
          console.log(`Finding tokens owned by ${address}...`);
          
          // Scan all tokens from 0 to totalSupply-1
          for (let i = 0; i < Number(totalSupply); i += maxBatchSize) {
            const batch = [];
            for (let j = 0; j < maxBatchSize && i + j < Number(totalSupply); j++) {
              batch.push(i + j);
            }
            
            console.log(`Scanning tokens ${batch[0]} to ${batch[batch.length-1]}`);
            
            // Get the owner of each token
            const ownerChecks = batch.map(tokenId => ({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: ABI as any,
              functionName: 'ownerOf',
              args: [BigInt(tokenId)],
            }));
            
            const ownerResults = await publicClient.multicall({
              contracts: ownerChecks,
              allowFailure: true,
            });
            
            // Process results - only add tokens owned by the connected address
            ownerResults.forEach((result, index) => {
              if (result.status === 'success') {
                const tokenId = batch[index];
                const owner = result.result;
                
                if (owner && owner.toLowerCase() === address.toLowerCase()) {
                  console.log(`Token ${tokenId} belongs to user: ${address}`);
                  foundTokens.push(tokenId);
                }
              }
            });
          }
        } 
        // If no wallet is connected, don't show any invites (user must connect)
        else {
          console.log('No wallet connected, not showing any invites');
        }
        
        console.log('All found tokens:', foundTokens);
        
        if (foundTokens.length > 0) {
          setTokenIds(foundTokens);
        } else {
          console.log('No tokens found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error scanning tokens:', error);
        setLoading(false);
      }
    };
    
    fetchAllTokens();
  }, [address, isConnected, publicClient, clientReady]);

  // Fall back to Transfer events if the above method fails
  useEffect(() => {
    // Only run if we haven't found tokens with the first method
    if (tokenIds.length > 0 || !address || !isConnected || !clientReady) return;
    
    const fetchTokensByEvents = async () => {
      setLoading(true);
      console.log(`Falling back to Transfer events scan for ${address}...`);
      
      try {
        // Rest of the existing Transfer event scanning code...
        // ... (Keep the existing Transfer event code as fallback)
        
        // This is the Transfer event signature
        const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        
        // Create a filter for Transfer events where the user is the recipient
        // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
        // We want events where 'to' is the user's address
        const filter = {
          address: CONTRACT_ADDRESS as `0x${string}`,
          fromBlock: 'earliest' as const,
          toBlock: 'latest' as const,
          topics: [
            transferEventSignature, // Transfer event signature
            null, // from (any address)
            `0x000000000000000000000000${address.slice(2).toLowerCase()}` // to (user address, properly padded)
          ]
        };
        
        console.log('Filter:', filter);
        
        // Get the logs
        const logs = await publicClient.getLogs(filter);
        console.log('Transfer event logs found:', logs);
        
        // Extract token IDs from the logs
        const receivedTokenIds: number[] = [];
        
        // Process the logs to extract token IDs
        for (const log of logs) {
          // In a Transfer event, the tokenId is in the third topic (index 3)
          if (log.topics && log.topics.length >= 4) {
            const tokenIdHex = log.topics[3];
            const tokenId = parseInt(tokenIdHex, 16);
            console.log(`Found token transfer: ${tokenId}`);
            receivedTokenIds.push(tokenId);
          }
        }
        
        // We also need to check if the user has transferred any tokens away
        // Create a filter for Transfer events where the user is the sender
        const outFilter = {
          address: CONTRACT_ADDRESS as `0x${string}`,
          fromBlock: 'earliest' as const,
          toBlock: 'latest' as const,
          topics: [
            transferEventSignature, // Transfer event signature
            `0x000000000000000000000000${address.slice(2).toLowerCase()}`, // from (user address)
            null // to (any address)
          ]
        };
        
        // Get the logs for outgoing transfers
        const outLogs = await publicClient.getLogs(outFilter);
        console.log('Outgoing transfer logs found:', outLogs);
        
        // Extract token IDs that the user has sent to others
        const sentTokenIds: number[] = [];
        for (const log of outLogs) {
          if (log.topics && log.topics.length >= 4) {
            const tokenIdHex = log.topics[3];
            const tokenId = parseInt(tokenIdHex, 16);
            console.log(`Found token sent: ${tokenId}`);
            sentTokenIds.push(tokenId);
          }
        }
        
        // Filter out tokens that the user has sent away
        const currentTokenIds = receivedTokenIds.filter(id => !sentTokenIds.includes(id));
        
        console.log('Current tokens owned by user:', currentTokenIds);
        
        // Update state with the token IDs
        if (currentTokenIds.length > 0) {
          setTokenIds(currentTokenIds);
        } else {
          console.log('No tokens found for this user via events');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error scanning Transfer events:', error);
        setLoading(false);
      }
    };
    
    fetchTokensByEvents();
  }, [tokenIds.length, address, isConnected, publicClient, clientReady]);

  // Then, fetch invite details for all owned token IDs
  useEffect(() => {
    const fetchInviteDetails = async () => {
      if (tokenIds.length === 0) {
        setLoading(false);
        return;
      }
      
      console.log('Fetching invite details for token IDs:', tokenIds);
      
      try {
        // Use individual calls instead of multicall for more reliability
        const inviteData: InviteData[] = [];
        
        for (const tokenId of tokenIds) {
          try {
            console.log(`Fetching invite details for token ID ${tokenId}`);
            
            const data = await publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: ABI as any,
              functionName: 'invites',
              args: [BigInt(tokenId)],
            });
            
            console.log(`Got invite data for token ${tokenId}:`, data);
            
            if (data) {
              const invite = {
                id: tokenId,
                topic: (data as any)[3] || 'No Topic',           // topic at index 3
                sender: (data as any)[0] || '0x0000000000000000000000000000000000000000', // host at index 0
                expiration: (data as any)[1] || BigInt(0),       // expiration at index 1
                isRedeemed: (data as any)[2] || false,           // isRedeemed at index 2
                duration: (data as any)[4] || BigInt(0),         // duration at index 4
              };
              
              console.log(`Parsed invite for token ${tokenId}:`, invite);
              inviteData.push(invite);
            }
          } catch (error) {
            console.error(`Error fetching details for token ${tokenId}:`, error);
          }
        }
        
        console.log('All fetched invite data:', inviteData);
        
        setInvites(inviteData);
        
        // Select the first valid invite by default if there is one
        const firstValidInvite = inviteData.find(invite => 
          !invite.isRedeemed && invite.expiration > BigInt(Math.floor(Date.now() / 1000))
        );
        
        if (firstValidInvite && !selectedInvite) {
          console.log('Setting selected invite:', firstValidInvite.id);
          setSelectedInvite(firstValidInvite.id);
        }
      } catch (error) {
        console.error('Error fetching invite details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInviteDetails();
  }, [tokenIds, publicClient, selectedInvite]);

  const getInviteStatus = (invite: InviteData) => {
    if (invite.isRedeemed) {
      return { label: 'Booked', className: 'bg-blue-500/10 border-blue-500 text-blue-500' };
    }
    
    if (invite.expiration < BigInt(Math.floor(Date.now() / 1000))) {
      return { label: 'Expired', className: 'bg-yellow-500/10 border-yellow-500 text-yellow-500' };
    }
    
    return { label: 'Active', className: 'bg-green-500/10 border-green-500 text-green-500' };
  };

  // Format address for display
  const formatAddress = (address: string): string => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return 'Unknown';
    try {
      return `${address.substring(0, 6)}...${address.substring(38)}`;
    } catch (e) {
      return address;
    }
  };

  // If not client ready yet, show a skeleton loader
  if (!clientReady) {
    return (
      <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-primary">
        <div className="z-10 max-w-6xl w-full">
          <div className="flex justify-between mb-8">
            <div className="h-10 w-48 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="h-64 w-full bg-gray-800 rounded animate-pulse"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-primary">
      <div className="z-10 max-w-6xl w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-accent">My Invites</h1>
            <p className="text-gray-400 mt-1">Calendar invites sent to your wallet address</p>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://sepolia.basescan.org/address/0x12d23ebda380859087b441c9de907ce00bd58662" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              View Contract
            </a>
            <Link href="/" className="text-blue-400 hover:underline">
              Create New Invite
            </Link>
            <ConnectButton />
          </div>
        </div>
        
        {!isConnected ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full">
              <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
                <h2 className="text-2xl font-bold text-accent mb-6">Connect Wallet to View Your Invites</h2>
                <p className="text-gray-400 mb-8">
                  Connect your wallet to view and manage your calendar invites. 
                  <br />Once connected, you'll see all the meeting invites sent to your wallet address.
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
                <div className="mt-10 pt-6 border-t border-gray-700 flex justify-center">
                  <Link href="/" className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors">
                    Create New Invite
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-1/3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-accent">My Calendar Invites</h2>
                {loading && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                )}
              </div>
              
              <div className="space-y-3">
                {invites.length > 0 ? (
                  invites.map((invite) => {
                    const status = getInviteStatus(invite);
                    
                    return (
                      <button
                        key={invite.id}
                        onClick={() => setSelectedInvite(invite.id)}
                        className={`w-full p-4 rounded-lg text-left ${
                          selectedInvite === invite.id
                            ? 'bg-blue-500/10 border border-blue-500'
                            : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-accent">{invite.topic}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              From: {formatAddress(invite.sender)}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs border ${status.className}`}>
                            {status.label}
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {invite.isRedeemed 
                            ? 'Already booked'
                            : invite.expiration < BigInt(Math.floor(Date.now() / 1000))
                              ? 'Expired'
                              : `Expires: ${new Date(Number(invite.expiration) * 1000).toLocaleDateString()}`
                          }
                        </p>
                      </button>
                    );
                  })
                ) : loading ? (
                  <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400">Loading your invites...</p>
                  </div>
                ) : (
                  <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 mb-4">No invites found for your wallet address</p>
                    <p className="text-sm text-gray-500 mb-6">We couldn't find any calendar invites sent to {formatAddress(address || '')}</p>
                    
                    <div className="mb-6">
                      <h3 className="text-accent font-medium mb-2">Did someone send you an invite?</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        If you know the token ID of your invite, you can enter it manually:
                      </p>
                      <ManualTokenInput 
                        onTokenSubmit={(tokenId) => {
                          console.log("Manual token ID submitted:", tokenId);
                          setSelectedInvite(tokenId);
                        }} 
                      />
                    </div>
                    
                    <div className="mt-6 border-t border-gray-700 pt-6">
                      <Link href="/" className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                        Create New Invite
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full lg:w-2/3">
              {selectedInvite ? (
                <RedeemInvite tokenId={selectedInvite} />
              ) : (
                <div className="p-8 bg-gray-800 rounded-lg border border-gray-700 text-center">
                  <p className="text-gray-400">Select an invite to view details and book a meeting</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 