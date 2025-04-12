import { NextRequest, NextResponse } from 'next/server';
import { resolveFarcasterUsername, validateFarcasterUsername } from '@/utils/farcaster';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    // First validate the username exists
    const isValid = await validateFarcasterUsername(username);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid Farcaster username' },
        { status: 404 }
      );
    }

    // Then resolve to Ethereum address
    const address = await resolveFarcasterUsername(username);
    if (!address) {
      return NextResponse.json(
        { error: 'No verified Ethereum address found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('Error in username resolution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 