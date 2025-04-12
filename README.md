# NFT Calendar Invite

A Farcaster Frame web app that enables wallet users to mint NFT-based calendar invites. These NFTs can be transferred to other wallets, and the holder can redeem them to schedule a meeting via Google Calendar with a Google Meet link.

## Features

- Farcaster Frame integration
- Wallet connection via RainbowKit
- NFT minting and transfer
- Google Calendar integration
- Google Meet link generation

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
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app/api/frame/route.ts` - Farcaster Frame API route
- `src/app/api/frame/image/route.tsx` - Frame image generation
- `src/app/page.tsx` - Main application page
- `src/app/layout.tsx` - Root layout with metadata
- `contracts/` - Smart contract code

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 