import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Get authorization code from query parameters
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains the return URL
    
    // Ensure we have the authorization code
    if (!code) {
      return NextResponse.redirect('/error?message=No+authorization+code+received');
    }
    
    // Set up OAuth client
    const callbackUrl = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback` 
      : 'http://localhost:3000/api/google/callback';
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const userInfo = await oauth2.userinfo.get();
    
    // Store tokens securely in cookies
    // In production, you would store these in a database associated with the user
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    };
    
    if (tokens.access_token) {
      cookies().set('google_access_token', tokens.access_token, cookieOptions);
    }
    
    if (tokens.refresh_token) {
      cookies().set('google_refresh_token', tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }
    
    if (userInfo.data.email) {
      cookies().set('google_email', userInfo.data.email, cookieOptions);
    }
    
    // Also store a simple flag to indicate calendar is connected
    cookies().set('google_calendar_connected', 'true', {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
    
    // Store connected flag in localStorage for client-side access
    // This is done through a temporary cookie that the client will read and delete
    cookies().set('calendar_connected_flag', 'true', {
      maxAge: 60, // 1 minute, just long enough to be read
      path: '/',
    });
    
    // Redirect to the original page or home
    return NextResponse.redirect(new URL(state || '/', req.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect('/error?message=Authentication+failed');
  }
} 