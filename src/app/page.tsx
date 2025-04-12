'use client';

import { RainbowKitProvider, getDefaultWallets, ConnectButton } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, goerli } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import '@rainbow-me/rainbowkit/styles.css';

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

const { chains, provider } = configureChains(
  [baseSepolia],
  [publicProvider()]
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
              <ConnectButton />
            </div>
          </div>
        </main>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
