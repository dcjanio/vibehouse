import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CalendarInviteNFT contract...");

  const CalendarInviteNFT = await ethers.getContractFactory("CalendarInviteNFT");
  const calendarInviteNFT = await CalendarInviteNFT.deploy();

  await calendarInviteNFT.waitForDeployment();

  const address = await calendarInviteNFT.getAddress();
  console.log(`CalendarInviteNFT deployed to: ${address}`);

  console.log("Deployment completed!");
  console.log("--------------------");
  console.log("Remember to update CONTRACT_ADDRESS in your components:");
  console.log("- src/components/MintForm.tsx");
  console.log("- src/components/RedeemInvite.tsx");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 