# NFT Calendar Invite

A Farcaster Frame web app that enables wallet users to mint NFT-based calendar invites. These NFTs can be transferred to other wallets, and the holder can redeem them to schedule a meeting via Google Calendar with a Google Meet link.

## Features

- Farcaster Frame integration
- Wallet connection via RainbowKit
- NFT minting and transfer
- Google Calendar integration
- Google Meet link generation
- Multi-step booking flow

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Smart Contracts:** Solidity
- **Frame Handling:** Farcaster Frame SDK
- **Wallet Support:** WalletConnect, RainbowKit
- **Calendar Integration:** Google Calendar API
- **Backend:** Next.js API Routes

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```
   Required environment variables:
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Your Base Sepolia RPC URL - Get from: [Tenderly](tenderly.co)
   - `NEXT_PUBLIC_BASE_URL`: Local development URL
   - `NEXT_PUBLIC_HOST`: Local development host

4. Run the development server:
   ```bash
   npm run dev
   ```

## Farcaster Frame Implementation

The app implements a Farcaster Frame for seamless interaction within the Farcaster ecosystem:

### Frame Flow

1. **Initial Frame**: Users are presented with options to "Send Invite" or "Book Meeting"
2. **Send Invite Flow**:
   - Enter recipient wallet address
   - Enter meeting topic
   - Select meeting duration (30min/60min)
   - Confirm and mint the invite NFT
3. **Book Meeting Flow**:
   - Redirects to the invites page
   - View received NFT invites
   - Select a time slot based on sender's availability
   - Confirm booking

### Frame Components

- **Frame API Routes**: 
  - `/api/frame/route.ts` - Main entry point for frame interactions
  - `/api/frame/action/route.ts` - Handles multi-step frame actions with state management
  - `/api/frame/image/route.tsx` - Generates dynamic frame images

- **Frame State Management**:
  - Uses URI-encoded JSON state to maintain flow context
  - Preserves user input between steps
  - Handles redirects to app for final actions

### Frame Integration

- Automatic detection of Farcaster client environment
- Native wallet integration via Farcaster SDK
- Seamless transition between Frame and web app

## Security Notes

- Never commit `.env` or `.env.local` files to the repository
- Keep your API keys and RPC URLs secure
- Use environment variables for all sensitive information
- For production, set environment variables in your hosting platform (e.g., Vercel)

## Project Structure

- `src/app/api/frame/route.ts` - Farcaster Frame API route
- `src/app/api/frame/action/route.ts` - Frame action handler with state management
- `src/app/api/frame/image/route.tsx` - Frame image generation
- `src/app/page.tsx` - Main application page
- `src/app/invites/page.tsx` - Invite management page
- `src/components/MintForm.tsx` - Form for creating new invites
- `src/components/RedeemInvite.tsx` - Component for redeeming invites
- `src/components/FarcasterFrame.tsx` - Farcaster-specific UI component
- `contracts/CalendarInviteNFT.sol` - Smart contract for calendar invites

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 