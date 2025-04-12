import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import React from 'react';

export const runtime = 'edge';

function getTitle(type: string): string {
  switch (type) {
    case 'mint':
      return 'Mint Calendar Invite';
    case 'view':
      return 'View Your Invites';
    default:
      return 'NFT Calendar Invite';
  }
}

function getDescription(type: string): string {
  switch (type) {
    case 'mint':
      return 'Create and send NFT-based calendar invites';
    case 'view':
      return 'Manage your calendar invites and schedule meetings';
    default:
      return 'Mint and manage NFT-based calendar invites';
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'default';

    const title = getTitle(type);
    const description = getDescription(type);

    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            padding: '40px',
          },
        },
        [
          React.createElement(
            'h1',
            {
              key: 'title',
              style: {
                fontSize: '60px',
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '20px',
                textAlign: 'center',
              },
            },
            title
          ),
          React.createElement(
            'p',
            {
              key: 'description',
              style: {
                fontSize: '32px',
                color: '#a3a3a3',
                textAlign: 'center',
              },
            },
            description
          ),
        ]
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('Error generating image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
} 