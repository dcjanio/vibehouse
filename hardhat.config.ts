import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { fileURLToPath } from 'url';
import { dirname, resolve } from "path";

// ESM specific feature
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Ensure that we have all the environment variables we need.
const privateKey: string = process.env.PRIVATE_KEY || "";
const baseSepoliaRpc: string = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "";
const etherscanApiKey: string = process.env.ETHERSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    baseSepolia: {
      url: baseSepoliaRpc,
      accounts: [privateKey],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: etherscanApiKey,
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config; 