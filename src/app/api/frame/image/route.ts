import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'default';

  const fontData = await fetch(
    new URL('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')
  ).then((res) => res.arrayBuffer());

  try {
    const html = {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111111',
          padding: '40px',
        },
        children: [
          {
            type: 'h1',
            props: {
              style: {
                fontSize: '60px',
                fontFamily: 'Inter',
                color: 'white',
                marginBottom: '20px',
                textAlign: 'center',
              },
              children: type === 'create' ? 'Create Event' : type === 'view' ? 'View Events' : 'VibeHouse Events',
            },
          },
          {
            type: 'p',
            props: {
              style: {
                fontSize: '30px',
                fontFamily: 'Inter',
                color: '#888888',
                textAlign: 'center',
              },
              children:
                type === 'create'
                  ? 'Create and manage your events'
                  : type === 'view'
                  ? 'Browse and join events'
                  : 'Connect with your Farcaster friends',
            },
          },
        ],
      },
    };

    return new ImageResponse(html, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
        },
      ],
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
} 