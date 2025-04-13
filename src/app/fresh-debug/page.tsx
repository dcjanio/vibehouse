'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers, BrowserProvider, Contract } from 'ethers';

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

export default function FreshDebug() {
  // Client-side only state
  const [isClient, setIsClient] = useState(false);
  const [address, setAddress] = useState('');
  const [chainId, setChainId] = useState(0);
  const [formData, setFormData] = useState({
    recipient: '0x7C5361F5BB5e2Bb123C95e69BEd331f3b0b8f094',
    topic: 'Test Meeting',
    duration: 30,
    validDays: 30,
  });
  const [error, setError] = useState('');
  const [callResult, setCallResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    
    // Check if ethereum is available (MetaMask or other wallet)
    if (window.ethereum) {
      // Get connected accounts
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
          }
        })
        .catch(console.error);
      
      // Get current chain ID
      window.ethereum.request({ method: 'eth_chainId' })
        .then((chainId: string) => {
          setChainId(parseInt(chainId, 16));
        })
        .catch(console.error);
      
      // Set up listeners for account and chain changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0] || '');
      });
      
      window.ethereum.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId, 16));
      });
    }
    
    // Load transaction history
    try {
      const storedHistory = localStorage.getItem('txHistory');
      if (storedHistory) {
        const history = JSON.parse(storedHistory);
        setTxHistory(history);
      }
    } catch (e) {
      console.error("Failed to load transaction history:", e);
    }
  }, []);

  // Calculate expiration timestamp
  const getExpirationTimestamp = () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + formData.validDays);
    return Math.floor(expirationDate.getTime() / 1000);
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask or a compatible wallet.');
      return;
    }
    
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAddress(accounts[0]);
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    }
  };

  // Direct contract call function
  const directContractCall = async () => {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider detected");
    }
    
    try {
      setIsLoading(true);
      setError('');
      setCallResult('');
      
      // Connect to the provider
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );
      
      // Get the network to check we're on Base Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== 84532n) {
        throw new Error("Please connect to Base Sepolia network");
      }
      
      const durationSeconds = formData.duration * 60; // Convert to seconds
      const expirationTimestamp = getExpirationTimestamp();
      
      console.log("Starting contract call with params:", {
        recipient: formData.recipient,
        topic: formData.topic,
        duration: durationSeconds,
        expiration: expirationTimestamp
      });
      
      // Estimate gas
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
      
      console.log(`Estimated gas: ${gasEstimate.toString()}`);
      
      // Call the contract function
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
      
      // Store transaction in history
      try {
        const txHistory = JSON.parse(localStorage.getItem('txHistory') || '[]');
        txHistory.push({
          hash: tx.hash,
          timestamp: Date.now(),
          recipient: formData.recipient,
          topic: formData.topic
        });
        localStorage.setItem('txHistory', JSON.stringify(txHistory));
        setTxHistory(txHistory);
      } catch (e) {
        console.error("Failed to store tx hash in history:", e);
      }
      
      setCallResult(`Transaction successful: ${tx.hash}`);
      
      return tx.hash;
    } catch (error: any) {
      console.error("Contract call error:", error);
      
      if (error.message?.includes('user rejected')) {
        setError('Transaction rejected by user');
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else {
        setError(error.message || 'Unknown error');
      }
      
      // Check for transaction hash in error
      if (error.transaction?.hash) {
        try {
          const txHistory = JSON.parse(localStorage.getItem('txHistory') || '[]');
          txHistory.push({
            hash: error.transaction.hash,
            timestamp: Date.now(),
            recipient: formData.recipient,
            topic: formData.topic,
            error: error.message
          });
          localStorage.setItem('txHistory', JSON.stringify(txHistory));
          setTxHistory(txHistory);
        } catch (e) {
          console.error("Failed to store tx hash in history:", e);
        }
        
        setCallResult(`Transaction may be pending: ${error.transaction.hash}`);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // If not client-side, show minimal loading UI
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="p-8 text-center">
          <div className="mb-4 text-2xl font-bold">Loading Debug Page...</div>
          <div className="animate-pulse h-4 w-32 bg-gray-700 mx-auto rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:underline">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">NFT Debug (Hydration Safe)</h1>
          <p className="text-gray-400">Troubleshoot contract interaction issues with this simplified page</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Connection Status */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
            <div className="mb-2">
              <span className="font-medium">Wallet Connected:</span> {address ? 'Yes' : 'No'}
            </div>
            {address && (
              <div className="mb-2">
                <span className="font-medium">Address:</span> {address}
              </div>
            )}
            {chainId > 0 && (
              <div className="mb-2">
                <span className="font-medium">Network ID:</span> {chainId}
              </div>
            )}
            <div className="mb-2">
              <span className="font-medium">Expected Network:</span> Base Sepolia (ID: 84532)
            </div>
            {chainId !== 84532 && chainId > 0 && (
              <div className="text-red-500 font-medium mt-2">
                Wrong network! Please switch to Base Sepolia.
              </div>
            )}
            {!address && (
              <button 
                onClick={connectWallet}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Contract Info */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Contract Information</h2>
            <div className="mb-2">
              <span className="font-medium">Contract Address:</span>{' '}
              <a 
                href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {CONTRACT_ADDRESS}
              </a>
            </div>
            <div className="mb-2">
              <span className="font-medium">Function:</span> createInvite
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-gray-800 p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Contract Interaction</h2>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Recipient Address</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meeting Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duration (min)</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid For (days)</label>
                <select
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </div>
          </div>
          
          <button
            onClick={directContractCall}
            disabled={!address || isLoading}
            className={`w-full py-2 px-4 rounded-lg font-medium ${
              !address || isLoading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {isLoading ? 'Processing...' : 'Try Direct Contract Call'}
          </button>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-white text-sm">
              {error}
              {error.includes('Unknown error') && (
                <div className="mt-2 text-yellow-300">
                  Note: Your transaction might have been submitted despite this error.
                  Check your wallet history or <a href={`https://sepolia.basescan.org/address/${address}`} className="underline font-medium" target="_blank" rel="noopener noreferrer">Basescan explorer</a> for recent transactions.
                </div>
              )}
            </div>
          )}
          
          {callResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              callResult.includes('successful') 
                ? 'bg-green-500/20 border border-green-500 text-green-300'
                : 'bg-amber-500/20 border border-amber-500 text-amber-300'
            }`}>
              <div className="mb-2">{callResult}</div>
              {callResult.includes('Transaction successful:') || callResult.includes('Transaction may be pending:') ? (
                <div>
                  <a 
                    href={`https://sepolia.basescan.org/tx/${callResult.split(':')[1].trim()}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center mt-2 text-blue-400 hover:underline font-medium"
                  >
                    View on Basescan 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Transaction History */}
        {txHistory.length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>
            <div className="space-y-3">
              {txHistory.slice().reverse().slice(0, 5).map((tx, index) => (
                <div key={index} className={`p-3 rounded-lg border ${tx.error ? 'border-amber-500/50 bg-amber-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{tx.topic || 'Unknown Topic'}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">
                    To: {tx.recipient.slice(0, 6)}...{tx.recipient.slice(-4)}
                  </div>
                  <div className="mt-2 text-xs">
                    <a 
                      href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center"
                    >
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  {tx.error && (
                    <div className="mt-1 text-xs text-amber-300">
                      Note: {tx.error.includes('unknown error') ? 'Transaction may have succeeded despite error' : tx.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm text-gray-400">
              Showing last {Math.min(txHistory.length, 5)} of {txHistory.length} transactions
            </div>
          </div>
        )}

        {/* Troubleshooting Tips */}
        <div className="bg-gray-800 p-4 rounded-lg border border-blue-500/30">
          <h2 className="text-lg font-semibold mb-2 text-blue-300">Troubleshooting Tips</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Make sure your wallet is connected to <strong>Base Sepolia</strong> testnet</li>
            <li>Check that you have enough test ETH for gas fees</li>
            <li>Verify the contract address is correct and deployed on Base Sepolia</li>
            <li>Try refreshing the page and reconnecting your wallet</li>
            <li>Check browser console for any JavaScript errors</li>
          </ul>
          
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-medium text-blue-300 mb-2">Fixed Issue Notes:</h3>
            <p className="text-gray-300 mb-2">
              This page uses a completely client-side approach with direct wallet connection to avoid hydration errors.
            </p>
            <p className="text-gray-300">
              If this works better than the standard debug page, consider replacing the main debug page with this approach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 