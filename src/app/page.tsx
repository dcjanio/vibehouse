'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig, chains } from '@/lib/wagmi-config';
import Link from 'next/link';

// Create a NoSSR component to prevent hydration issues
const NoSSR = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <>{children}</>;
};

function LandingContent() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  
  // Admin wallet address
  const ADMIN_ADDRESS = '0x614220b724070f274D0DBeB3D42ED2804aF488c7';
  
  // Check if current wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  // Redirect to appropriate page when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      // No longer redirecting automatically
      console.log('User connected with address:', address);
    }
  }, [isConnected, address, router]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-blue-900 text-white">
      {/* Header with Connect Button */}
      <header className="w-full px-4 py-4 bg-gray-800 bg-opacity-50 backdrop-blur-lg z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold text-blue-400">NFT Calendar Invites</div>
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-1 text-sm">
                <span className="text-green-400">Connected:</span>
                <span className="text-gray-300 truncate max-w-[120px] md:max-w-[200px]">{address}</span>
              </div>
            ) : null}
            <ConnectButton />
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <div className="relative w-full px-4 pt-16 pb-32 flex flex-col items-center justify-center overflow-hidden flex-grow">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            NFT Calendar Invites
          </h1>
          <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
            Schedule meetings with blockchain-powered calendar invites. Secure, verifiable, and non-transferable.
          </p>
          
          <div className="bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl p-10 shadow-2xl border border-gray-700 mb-10 max-w-xl mx-auto">
            <div className="flex flex-col items-center">
              {!isConnected ? (
                <>
                  <h2 className="text-2xl font-bold mb-6">Connect Your Wallet</h2>
                  <p className="mb-8 text-center text-gray-300">
                    Access your personalized dashboard to create or manage meeting invites
                  </p>
                  <div className="transform hover:scale-105 transition duration-300">
                    <ConnectButton />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Wallet Connected!</h2>
                  <p className="mb-6 text-center text-green-300">
                    Choose what you'd like to do
                  </p>
                  <div className="flex flex-col space-y-4">
                    {isAdmin && (
                      <Link 
                        href="/create" 
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
                      >
                        Create New Invite
                      </Link>
                    )}
                    <Link 
                      href="/invites" 
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
                    >
                      View My Invites
                    </Link>
                  </div>
                  <p className="mt-4 text-sm text-blue-300">
                    {isAdmin 
                      ? 'Admin access granted. You can create and manage calendar invites.'
                      : 'You can view and schedule your received invites.'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="relative w-full py-16 bg-gray-900 bg-opacity-80">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-400">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Create Invite</h3>
              <p className="text-gray-300">Generate unique NFT-based calendar invites for your recipients. Each invite is a soulbound token.</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Receive Token</h3>
              <p className="text-gray-300">Recipients get a unique NFT in their wallet representing your meeting request.</p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg transform hover:scale-105 transition duration-300">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Schedule Meeting</h3>
              <p className="text-gray-300">Recipients redeem their NFT by scheduling a time slot, automatically adding the event to both calendars.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 py-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-500">NFT Calendar Invites — The future of blockchain-powered scheduling</p>
          <p className="text-sm text-gray-600 mt-2">Built on Base Sepolia Network</p>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <NoSSR>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <LandingContent />
        </RainbowKitProvider>
      </WagmiConfig>
    </NoSSR>
  );
}
