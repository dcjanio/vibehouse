import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>VibeHouse Events</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=default" />
          <meta property="fc:frame:button:1" content="Create Event" />
          <meta property="fc:frame:button:2" content="View Events" />
          <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action" />
          <meta property="og:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=default" />
          <meta property="og:title" content="VibeHouse Events" />
          <meta property="og:description" content="Create and join events with your Farcaster friends" />
        </head>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error generating frame:', error);
    return new Response('Error generating frame', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { untrustedData } = data;
    const { buttonIndex } = untrustedData;

    // Handle different button actions
    switch (buttonIndex) {
      case 1: // Create Event
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>Create Event - VibeHouse</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=create" />
              <meta property="fc:frame:button:1" content="Set Date" />
              <meta property="fc:frame:button:2" content="Set Time" />
              <meta property="fc:frame:button:3" content="Set Location" />
              <meta property="fc:frame:button:4" content="Create" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action" />
            </head>
          </html>`,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );

      case 2: // View Events
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>View Events - VibeHouse</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=view" />
              <meta property="fc:frame:button:1" content="Join" />
              <meta property="fc:frame:button:2" content="Share" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action" />
            </head>
          </html>`,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );

      default:
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>VibeHouse Events</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=default" />
              <meta property="fc:frame:button:1" content="Create Event" />
              <meta property="fc:frame:button:2" content="View Events" />
              <meta property="fc:frame:post_url" content="${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action" />
            </head>
          </html>`,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );
    }
  } catch (error) {
    console.error('Error handling frame action:', error);
    return new Response('Error handling frame action', { status: 500 });
  }
} 