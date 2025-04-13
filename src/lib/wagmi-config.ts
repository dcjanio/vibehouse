import { createConfig, configureChains } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';

// Define Base Sepolia chain
export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [process.env.TENDERLY_RPC_URL || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
    default: { http: [process.env.TENDERLY_RPC_URL || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'] },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
};

// Setup wallet connect - ensure valid project ID
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '5a44be1e636aeda6ba5fa050734dae03'; // Use env var with fallback

// Configure chains for the app
export const { chains, publicClient } = configureChains(
  [baseSepolia],
  [publicProvider()]
);

// Setup wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'NFT Calendar Invites',
  projectId,
  chains,
});

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export default wagmiConfig;

// Helper function to get the default configuration
export function getDefaultConfig() {
  return {
    wagmiConfig,
    chains,
    projectId
  };
} 