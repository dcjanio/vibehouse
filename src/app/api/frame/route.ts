import { sdk } from '@farcaster/frame-sdk';
import { NextRequest, NextResponse } from 'next/server';

// Get the base URL for OG images and redirects
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

// Helper to get host from request or default
function getHost(req: NextRequest) {
  const host = req.headers.get('host');
  if (host) {
    return host.includes('localhost') ? 'http://' + host : 'https://' + host;
  }
  return getBaseUrl();
}

export async function GET(req: NextRequest) {
  const host = getHost(req);

  try {
    // Create frame metadata tags
    const metadataTags = `
      <meta property="og:title" content="NFT Calendar Invite" />
      <meta property="og:description" content="Schedule meetings with web3 frens using NFT invites" />
      <meta property="og:image" content="${host}/api/frame/image?type=default" />
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content="${host}/api/frame/image?type=default" />
      <meta name="fc:frame:button:1" content="Send Invite" />
      <meta name="fc:frame:button:2" content="Book Meeting" />
      <meta name="fc:frame:input:text" content="Search by FID or wallet address (optional)" />
      <meta name="fc:frame:post_url" content="${host}/api/frame" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    `;

    // Return HTML with frame metadata
    return new NextResponse(`<!DOCTYPE html>
      <html>
        <head>
          <title>NFT Calendar Invite</title>
          ${metadataTags}
        </head>
        <body>
          <h1>NFT Calendar Invite</h1>
          <p>This is a Farcaster Frame for NFT Calendar Invite.</p>
        </body>
      </html>`);
  } catch (error) {
    console.error('Error generating frame:', error);
    return new NextResponse('Error generating frame', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const host = getHost(req);
  
  try {
    const body = await req.json();
    const { buttonIndex, inputText } = body;

    let redirectUrl;
    let imageUrl;
    let buttonLabels = [];
    
    // Handle different button actions
    if (buttonIndex === 1) {
      // Send Invite flow
      imageUrl = `${host}/api/frame/image?type=send`;
      buttonLabels = [
        "Create Invite",
        "How it works"
      ];
      redirectUrl = `${host}/?${inputText ? `recipient=${inputText}` : ''}`;
    } else if (buttonIndex === 2) {
      // Book Meeting flow
      imageUrl = `${host}/api/frame/image?type=view`;
      buttonLabels = [
        "View My Invites", 
        "How it works"
      ];
      redirectUrl = `${host}/invites`;
    } else {
      // Default to home page
      imageUrl = `${host}/api/frame/image?type=default`;
      buttonLabels = [
        "Send Invite",
        "Book Meeting"
      ];
      redirectUrl = host;
    }

    // Generate HTML response with frame metadata
    const metadataTags = `
      <meta property="og:title" content="NFT Calendar Invite" />
      <meta property="og:description" content="Schedule meetings with web3 frens using NFT invites" />
      <meta property="og:image" content="${imageUrl}" />
      <meta name="fc:frame" content="vNext" />
      <meta name="fc:frame:image" content="${imageUrl}" />
      <meta name="fc:frame:button:1" content="${buttonLabels[0]}" />
      <meta name="fc:frame:button:2" content="${buttonLabels[1]}" />
      <meta name="fc:frame:post_url" content="${host}/api/frame" />
      <meta name="fc:frame:post_redirect_url" content="${redirectUrl}" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    `;

    return new NextResponse(`<!DOCTYPE html>
      <html>
        <head>
          <title>NFT Calendar Invite</title>
          ${metadataTags}
        </head>
        <body>
          <h1>NFT Calendar Invite</h1>
          <p>This is a Farcaster Frame for NFT Calendar Invite.</p>
        </body>
      </html>`);
  } catch (error) {
    console.error('Error handling frame action:', error);
    return new NextResponse('Error handling frame action', { status: 500 });
  }
} 