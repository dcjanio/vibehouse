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
3. Copy `.env.example` to `.env.local` and fill in the required values:
   ```bash
   cp .env.example .env.local
   ```
   Required environment variables:
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Your Base Sepolia RPC URL
   - `NEXT_PUBLIC_BASE_URL`: Local development URL
   - `NEXT_PUBLIC_HOST`: Local development host

4. Run the development server:
   ```bash
   npm run dev
   ```

## Security Notes

- Never commit `.env` or `.env.local` files to the repository
- Keep your API keys and RPC URLs secure
- Use environment variables for all sensitive information
- For production, set environment variables in your hosting platform (e.g., Vercel)

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