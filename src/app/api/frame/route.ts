import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface FrameRequest {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex: number;
    castId: {
      fid: number;
      hash: string;
    };
  };
}

// Helper function to get base URL with fallback
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
};

export async function GET(req: NextRequest) {
  try {
    const baseUrl = getBaseUrl();
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>NFT Calendar Invite</title>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${baseUrl}/api/frame/image?type=default" />
          <meta property="fc:frame:button:1" content="Mint Invite" />
          <meta property="fc:frame:button:2" content="View Invites" />
          <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
          <meta property="og:image" content="${baseUrl}/api/frame/image?type=default" />
          <meta property="og:title" content="NFT Calendar Invite" />
          <meta property="og:description" content="Mint and manage NFT-based calendar invites" />
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
    const body: FrameRequest = await req.json();
    const buttonIndex = body.untrustedData.buttonIndex;
    const baseUrl = getBaseUrl();

    switch (buttonIndex) {
      case 1: // Mint Invite
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>Mint Invite - NFT Calendar</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/api/frame/image?type=mint" />
              <meta property="fc:frame:button:1" content="Connect Wallet" />
              <meta property="fc:frame:button:2" content="Back" />
              <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
            </head>
          </html>`,
          {
            headers: {
              'Content-Type': 'text/html',
            },
          }
        );

      case 2: // View Invites
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>View Invites - NFT Calendar</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/api/frame/image?type=view" />
              <meta property="fc:frame:button:1" content="Connect Wallet" />
              <meta property="fc:frame:button:2" content="Back" />
              <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
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
              <title>NFT Calendar Invite</title>
              <meta property="fc:frame" content="vNext" />
              <meta property="fc:frame:image" content="${baseUrl}/api/frame/image?type=default" />
              <meta property="fc:frame:button:1" content="Mint Invite" />
              <meta property="fc:frame:button:2" content="View Invites" />
              <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
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