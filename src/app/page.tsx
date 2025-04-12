'use client';

import { useState } from 'react';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import '@rainbow-me/rainbowkit/styles.css';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';

const { chains, provider } = configureChains(
  [mainnet, goerli],
  [alchemyProvider({ apiKey: alchemyApiKey })]
);

const { connectors } = getDefaultWallets({
  appName: 'NFT Calendar Invite',
  projectId,
  chains,
});

const client = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <WagmiConfig client={client}>
      <RainbowKitProvider chains={chains}>
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-primary">
          <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
            <h1 className="text-4xl font-bold text-accent mb-8 text-center">
              NFT Calendar Invite
            </h1>
            <p className="text-xl text-secondary mb-8 text-center">
              Mint and manage NFT-based calendar invites
            </p>
            <div className="flex flex-col items-center justify-center">
              <button
                className="bg-accent text-primary px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                onClick={() => setIsConnected(!isConnected)}
              >
                {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </main>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
