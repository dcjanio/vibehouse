# NFT Calendar Invite

A decentralized calendar invitation system using soulbound NFTs. The system allows the contract owner to mint NFT invites that recipients can redeem to schedule meetings, with all details securely stored on the blockchain and in Supabase.

## Overview

NFT Calendar Invite enables an intuitive way to schedule meetings using blockchain technology:

1. The contract owner mints an NFT invite for a specific recipient
2. The NFT is sent directly to the recipient's wallet
3. The invite details (topic, duration, etc.) are stored both on-chain and in Supabase
4. Recipients can view and redeem their NFTs to schedule a meeting time
5. Once scheduled, both parties receive calendar notifications

## Key Features

- **Soulbound NFTs**: NFTs are non-transferable after minting, ensuring only the intended recipient can schedule meetings
- **Owner-Only Minting**: Only the contract owner (`0x614220b724070f274D0DBeB3D42ED2804aF488c7`) can mint invite NFTs
- **On-chain Data**: Critical invitation details stored directly on the blockchain
- **Supabase Integration**: Additional metadata and scheduling details stored in Supabase
- **Google Calendar Integration**: Scheduled meetings can be integrated with Google Calendar

## Soulbound NFT Contract

The project uses a custom `SoulboundCalendarInviteNFT` contract with the following features:

- ERC721-based NFT with soulbound properties
- NFTs cannot be transferred once minted to the recipient
- Only the contract owner can mint new invites
- Recipients can redeem invites to schedule meetings
- Built-in tracking of invite status (redeemed, expired, etc.)

## Technical Architecture

- **Smart Contract**: Solidity contract deployed on Base Sepolia testnet
- **Frontend**: Next.js application with ethers.js for blockchain interaction
- **Database**: Supabase for storing additional invite metadata
- **Authentication**: Wallet-based authentication (MetaMask, etc.)
- **Calendar**: Google Calendar API integration for scheduling

## Deployment Instructions

### Prerequisites

- Node.js (v16+)
- Hardhat
- MetaMask or similar wallet
- Supabase account
- Google API credentials (for calendar integration)

### Contract Deployment

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/nft-calendar-invite.git
   cd nft-calendar-invite
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the environment variables:
   ```
   cp .env.example .env
   ```
   Then edit `.env` to add your own values.

4. Compile the contract:
   ```
   npx hardhat compile
   ```

5. Deploy to Base Sepolia testnet:
   ```
   npx hardhat run scripts/deploy-soulbound.ts --network base-sepolia
   ```

6. Update the contract address in:
   - `src/components/MintForm.tsx`
   - `src/components/RedeemInvite.tsx`
   - `src/app/api/invites/route.ts`

### Frontend Deployment

1. Update your Supabase credentials in `.env`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
   ```

2. Set up the Supabase table:
   ```sql
   -- Run this SQL in the Supabase SQL Editor
   CREATE TABLE calendar_invites (
     id BIGSERIAL PRIMARY KEY,
     token_id INTEGER NOT NULL UNIQUE,
     sender_address TEXT NOT NULL,
     recipient_address TEXT NOT NULL,
     recipient_email TEXT,
     topic TEXT NOT NULL,
     duration INTEGER NOT NULL,
     expiration BIGINT NOT NULL,
     is_redeemed BOOLEAN DEFAULT FALSE,
     redeemed_at TIMESTAMP WITH TIME ZONE,
     scheduled_time TIMESTAMP WITH TIME ZONE,
     transaction_hash TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   CREATE INDEX idx_calendar_invites_sender_address ON calendar_invites(sender_address);
   CREATE INDEX idx_calendar_invites_recipient_address ON calendar_invites(recipient_address);
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. For production deployment:
   ```
   npm run build
   npm start
   ```

## Setup Instructions

### Environment Variables

1. Copy the `.env.example` file to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

2. Update the following values in your `.env` file:
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Your WalletConnect project ID
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Base Sepolia RPC URL
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project and get your URL and anon key from the API settings
3. Create the Supabase table by running the SQL in `supabase-setup.sql`
4. Create `supabase.ts` from the template:
```bash
cp src/lib/supabase.template.ts src/lib/supabase.ts
```

5. For local development, you may need to update `src/lib/supabase.ts` with your hardcoded credentials. This file is ignored in git to prevent exposing sensitive information.

### Running the Application

```bash
npm install
npm run dev
```

## Testing

The application includes several test pages:
- `/debug`: Test direct contract calls and view transaction history
- `/verify`: Verify Supabase connection and table structure

## Usage

### Minting an Invite

1. Connect with the contract owner wallet
2. Fill in the recipient address, email, topic, and duration
3. Click "Generate Invite NFT"
4. Confirm the transaction in your wallet
5. The NFT will be minted directly to the recipient

### Viewing & Redeeming Invites

1. Connect with your wallet
2. Navigate to the "Invites" page
3. Find your received invites in the "Received Invites" tab
4. Click "Schedule Meeting" on any invite
5. Select a date and time for the meeting
6. Click "Schedule" to redeem the invite

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Base Sepolia Testnet for blockchain infrastructure
- Supabase for database services
- Google Calendar API for scheduling integration
- OpenZeppelin for secure smart contract libraries 