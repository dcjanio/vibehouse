import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;
    const refreshToken = cookieStore.get('google_refresh_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ authenticated: false });
    }
    
    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_BASE_URL 
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback` 
        : 'http://localhost:3000/api/google/callback'
    );
    
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    // Verify token is valid by making a simple API call
    try {
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2'
      });
      
      // This will throw an error if token is invalid
      await oauth2.userinfo.get();
      
      return NextResponse.json({ authenticated: true });
    } catch (error) {
      console.error('Token verification error:', error);
      
      // Clear invalid tokens
      const response = NextResponse.json({ authenticated: false });
      response.cookies.delete('google_access_token');
      response.cookies.delete('google_refresh_token');
      
      return response;
    }
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
} 