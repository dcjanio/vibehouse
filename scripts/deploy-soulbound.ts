import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SoulboundCalendarInviteNFT contract...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contract from account: ${deployer.address}`);

  // Deploy the contract
  const SoulboundCalendarInviteNFT = await ethers.getContractFactory("SoulboundCalendarInviteNFT");
  const soulboundCalendarInviteNFT = await SoulboundCalendarInviteNFT.deploy();

  await soulboundCalendarInviteNFT.waitForDeployment();

  const address = await soulboundCalendarInviteNFT.getAddress();
  console.log(`SoulboundCalendarInviteNFT deployed to: ${address}`);

  console.log("Deployment completed!");
  console.log("--------------------");
  console.log("Contract Owner (only account allowed to mint invites):", deployer.address);
  console.log("--------------------");
  console.log("Remember to update CONTRACT_ADDRESS in your components:");
  console.log("- src/components/MintForm.tsx");
  console.log("- src/components/RedeemInvite.tsx");
  console.log("- src/app/api/invites/route.ts");
  console.log("--------------------");
  console.log("Key features of the new soulbound NFT:");
  console.log("1. Only contract owner can mint NFTs");
  console.log("2. NFTs are soulbound and cannot be transferred");
  console.log("3. Recipients can still redeem their invites");
  console.log("4. Added additional helper functions for token ownership");
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 