import { ethers } from "hardhat";

async function main() {
  const CalendarInviteNFT = await ethers.getContractFactory("CalendarInviteNFT");
  const calendarInviteNFT = await CalendarInviteNFT.deploy();

  await calendarInviteNFT.waitForDeployment();

  console.log(
    `CalendarInviteNFT deployed to ${await calendarInviteNFT.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 