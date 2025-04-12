import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Common styles
    const containerStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      color: '#fff',
      padding: '20px',
    };

    const h1Style = {
      fontSize: 48,
      marginBottom: 20,
    };

    const pStyle = {
      fontSize: 24,
      textAlign: 'center' as const,
    };

    // Generate different images based on the type
    switch (type) {
      case 'date':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Set Event Date</h1>
              <p style={pStyle}>
                Enter the date for your event (YYYY-MM-DD)
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      case 'time':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Set Event Time</h1>
              <p style={pStyle}>
                Enter the time for your event (HH:MM)
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      case 'location':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Set Location</h1>
              <p style={pStyle}>
                Enter the venue or address for your event
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      case 'success':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Event Created!</h1>
              <p style={pStyle}>
                Your event has been successfully created
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      case 'create':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Create Event</h1>
              <p style={pStyle}>
                Set up your event details and invite others to join!
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      case 'view':
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>Event Details</h1>
              <p style={pStyle}>
                Join this event and connect with others!
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );

      default:
        return new ImageResponse(
          (
            <div style={containerStyle}>
              <h1 style={h1Style}>VibeHouse</h1>
              <p style={pStyle}>
                Create and join events with your Farcaster friends
              </p>
            </div>
          ),
          { width: 1200, height: 630 }
        );
    }
  } catch (error) {
    console.error('Error generating frame image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
} 