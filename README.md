# NFT Calendar Invite

A Farcaster Frame web app that enables wallet users to mint NFT-based calendar invites. These NFTs can be transferred to other wallets, and the holder can redeem them to schedule a meeting via Google Calendar with a Google Meet link.

## Features

- Farcaster Frame integration
- Wallet connection via RainbowKit
- NFT minting and transfer
- Google Calendar integration with OAuth authentication
- Google Meet link generation
- Multi-step booking flow
- Email notifications with calendar attachments
- View specific invites by token ID
- Filter invites by status (Upcoming, Pending, Past)

## Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Smart Contracts:** Solidity
- **Frame Handling:** Farcaster Frame SDK
- **Wallet Support:** WalletConnect, RainbowKit
- **Calendar Integration:** Google Calendar API
- **Email Services:** Nodemailer with iCal
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
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get from [Reown](https://cloud.walletconnect.com/)
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC`: Your Base Sepolia RPC URL - Get from: [Tenderly](tenderly.co)
   - `NEXT_PUBLIC_BASE_URL`: Local development URL
   - `NEXT_PUBLIC_HOST`: Local development host
   - `GOOGLE_CLIENT_ID`: OAuth client ID from Google Cloud Console
   - `GOOGLE_CLIENT_SECRET`: OAuth client secret from Google Cloud Console
   - `EMAIL_HOST`: SMTP server for email notifications (optional)
   - `EMAIL_PORT`: SMTP port (optional)
   - `EMAIL_USER`: SMTP username (optional)
   - `EMAIL_PASS`: SMTP password (optional)
   - `EMAIL_FROM`: Default sender email (optional)

4. Set up Google Cloud Console:
   - Create a new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Configure the OAuth consent screen with appropriate scopes
   - Add your domain to authorized redirects

5. Run the development server:
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

## Google Calendar Integration

The app provides a complete Google Calendar integration:

1. **OAuth Authentication**:
   - Secure OAuth 2.0 flow
   - Token storage and refresh
   - User email retrieval

2. **Calendar Operations**:
   - Check calendar availability (/api/google/calendar/availability)
   - Create calendar events (/api/google/calendar/events)
   - Generate Google Meet links

3. **Email Notifications**:
   - iCalendar (.ics) attachments
   - HTML and plain text formats
   - Meeting details including Google Meet links

## Security Notes

- Never commit `.env` or `.env.local` files to the repository
- Keep your API keys and RPC URLs secure
- Use environment variables for all sensitive information
- For production, set environment variables in your hosting platform (e.g., Vercel)

## Project Structure

- `src/app/api/frame/route.ts` - Farcaster Frame API route
- `src/app/api/frame/action/route.ts` - Frame action handler with state management
- `src/app/api/frame/image/route.tsx` - Frame image generation
- `src/app/api/google/auth/route.ts` - Google OAuth authentication endpoint
- `src/app/api/google/callback/route.ts` - OAuth callback handler
- `src/app/api/google/calendar/events/route.ts` - Calendar event creation
- `src/app/api/google/calendar/availability/route.ts` - Calendar availability check
- `src/app/page.tsx` - Main application page
- `src/app/invites/page.tsx` - Invite management page with filtering
- `src/components/MintForm.tsx` - Form for creating new invites
- `src/components/RedeemInvite.tsx` - Component for redeeming invites
- `src/components/FarcasterFrame.tsx` - Farcaster-specific UI component
- `src/components/ManualTokenInput.tsx` - Component for viewing specific token IDs
- `contracts/CalendarInviteNFT.sol` - Smart contract for calendar invites

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 
