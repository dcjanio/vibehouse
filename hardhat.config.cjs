require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY || "";
const baseSepoliaRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
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