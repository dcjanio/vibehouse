'use client';

import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';
import FarcasterFrame from '@/components/FarcasterFrame';
import { useEffect, useState } from 'react';
import Head from 'next/head';

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

export default function FarcasterPage() {
  const [isFarcaster, setIsFarcaster] = useState(false);

  useEffect(() => {
    // Simple check to see if the app is likely being viewed in a Farcaster client
    // A more robust check would be done in the FarcasterFrame component
    setIsFarcaster(
      typeof window !== 'undefined' && 
      (window.location.href.includes('warpcast') || 
       window.navigator.userAgent.toLowerCase().includes('farcaster'))
    );
  }, []);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Head>
          <title>NFT Calendar Invite | Farcaster Mini App</title>
          <meta name="description" content="Schedule meetings using NFT calendar invites" />
          <meta property="og:title" content="NFT Calendar Invite" />
          <meta property="og:description" content="Schedule meetings using NFT calendar invites" />
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}/og-image.png`} />
        </Head>

        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-primary">
          <div className="z-10 w-full max-w-md">
            {/* This will only render if in a Farcaster client */}
            <FarcasterFrame />

            {/* Only show this content if NOT in a Farcaster client */}
            {!isFarcaster && (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-accent mb-4">
                  NFT Calendar Invite
                </h1>
                <p className="text-gray-400 mb-6">
                  This app works best within a Farcaster client. 
                  Please open in Warpcast or other Farcaster app.
                </p>
                <div className="flex justify-center mb-8">
                  <ConnectButton />
                </div>
                <a 
                  href="https://warpcast.com" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Open Warpcast →
                </a>
              </div>
            )}
          </div>
        </main>
      </RainbowKitProvider>
    </WagmiConfig>
  );
} 