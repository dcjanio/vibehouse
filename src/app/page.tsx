'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';
import MintForm from '@/components/MintForm';
import { useEffect, useState } from 'react';

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

export default function Home() {
  const searchParams = useSearchParams();
  const [frameParams, setFrameParams] = useState<{
    recipient?: string;
    topic?: string;
    duration?: number;
  }>({});
  
  // Extract parameters from URL if they exist (for frame redirects)
  useEffect(() => {
    const recipient = searchParams.get('recipient');
    const topic = searchParams.get('topic');
    const duration = searchParams.get('duration');
    
    const params: {
      recipient?: string;
      topic?: string;
      duration?: number;
    } = {};
    
    if (recipient) params.recipient = recipient;
    if (topic) params.topic = topic;
    if (duration) params.duration = parseInt(duration);
    
    setFrameParams(params);
  }, [searchParams]);

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <main className="flex min-h-screen flex-col items-center p-6 md:p-24 bg-primary">
          <div className="z-10 max-w-5xl w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h1 className="text-4xl font-bold text-accent">NFT Calendar Invite</h1>
              <div className="flex items-center gap-4">
                <Link href="/invites" className="text-blue-400 hover:underline">
                  View My Invites
                </Link>
                <ConnectButton />
              </div>
            </div>
            
            <p className="text-xl text-gray-400 mb-8 text-center">
              Mint and manage NFT-based calendar invites
            </p>
            
            <div className="flex flex-col items-center justify-center">
              <MintForm initialData={frameParams} />
            </div>
          </div>
        </main>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
