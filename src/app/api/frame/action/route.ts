import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { untrustedData, trustedData } = data;
    
    // Extract relevant data
    const { buttonIndex, inputText } = untrustedData;
    const { fid } = trustedData;

    // Handle different actions based on button index
    switch (buttonIndex) {
      case 1: // Set Date
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=date`,
            input: {
              text: 'Enter date (YYYY-MM-DD)',
              placeholder: '2024-04-20'
            },
            buttons: [
              { label: 'Confirm Date', action: 'post' },
              { label: 'Back', action: 'post' }
            ],
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action`
          }
        });

      case 2: // Set Time
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=time`,
            input: {
              text: 'Enter time (HH:MM)',
              placeholder: '14:00'
            },
            buttons: [
              { label: 'Confirm Time', action: 'post' },
              { label: 'Back', action: 'post' }
            ],
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action`
          }
        });

      case 3: // Set Location
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=location`,
            input: {
              text: 'Enter location',
              placeholder: 'Enter venue or address'
            },
            buttons: [
              { label: 'Confirm Location', action: 'post' },
              { label: 'Back', action: 'post' }
            ],
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action`
          }
        });

      case 4: // Create Event
        // Here you would typically save the event to your database
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=success`,
            buttons: [
              { label: 'View Event', action: 'post' },
              { label: 'Share', action: 'post' }
            ],
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action`
          }
        });

      default:
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/image?type=default`,
            buttons: [
              { label: 'Create Event', action: 'post' },
              { label: 'View Events', action: 'post' }
            ],
            postUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/frame/action`
          }
        });
    }
  } catch (error) {
    console.error('Error handling frame action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 