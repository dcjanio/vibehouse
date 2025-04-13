# Calendar Integration Components

This document provides an overview of the calendar integration components in the NFT Calendar application.

## AddToCalendarButton

The `AddToCalendarButton` component provides functionality to add NFT invites to a user's calendar. It offers two options:

1. **Quick Calendar Link** - Creates a Google Calendar URL that can be clicked to add the event to the user's calendar without requiring authentication.
2. **Google Calendar API** - Uses the Google Calendar API to create an event directly in the user's calendar, which requires Google authentication.

### Usage

```tsx
import AddToCalendarButton from '@/components/AddToCalendarButton';

// Inside your component
<AddToCalendarButton 
  tokenId="123" 
  topic="Meeting Topic" 
  duration={30} 
  className="your-custom-class" 
/>
```

### Props

- `tokenId` (string, required): The token ID of the NFT invite
- `topic` (string, required): The topic/title of the calendar event
- `duration` (number, required): The duration of the event in minutes
- `className` (string, optional): Additional CSS classes to apply to the button

### Features

- Allows users to select a date and time for the event
- Provides two calendar integration methods (quick link or API-based)
- Handles Google authentication flow
- Stores event information in Supabase
- Updates invite records with calendar event IDs
- Shows success and error messages

### Requirements

To use this component, ensure that:

1. The Supabase client is configured
2. Google OAuth credentials are set up in environment variables
3. The necessary API endpoints are implemented:
   - `/api/google/auth` - For initiating Google authentication
   - `/api/google/auth/status` - For checking authentication status
   - `/api/google/calendar/events` - For creating calendar events

## Environment Variables

The following environment variables are needed:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_BASE_URL=your_app_base_url
``` 