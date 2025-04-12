import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';
import ical from 'ical-generator';
import nodemailer from 'nodemailer';

// Helper to create OAuth client with stored credentials
function getAuthenticatedClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback` 
      : 'http://localhost:3000/api/google/callback'
  );
  
  const cookieStore = cookies();
  const accessToken = cookieStore.get('google_access_token')?.value;
  const refreshToken = cookieStore.get('google_refresh_token')?.value;
  
  if (!accessToken) {
    throw new Error('Not authenticated with Google');
  }
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  
  return oauth2Client;
}

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { 
      start, 
      end, 
      summary, 
      description, 
      location,
      attendeeEmail,
      tokenId,
      sendEmail = true
    } = body;
    
    // Validate required fields
    if (!start || !end || !summary) {
      return NextResponse.json(
        { error: 'Missing required fields (start, end, summary)' },
        { status: 400 }
      );
    }
    
    if (sendEmail && !attendeeEmail) {
      return NextResponse.json(
        { error: 'Attendee email is required when sendEmail is true' },
        { status: 400 }
      );
    }
    
    // Get authenticated client
    const auth = getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Get the user's email
    const oauth2 = google.oauth2({
      auth,
      version: 'v2'
    });
    
    const userInfo = await oauth2.userinfo.get();
    const userEmail = userInfo.data.email;
    
    // Prepare the event
    const event = {
      summary: summary,
      description: description || `NFT Calendar Invite #${tokenId || 'Unknown'}`,
      location: location || 'Google Meet (link will be added)',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendeeEmail ? [
        { email: userEmail },
        { email: attendeeEmail },
      ] : undefined,
      conferenceData: {
        createRequest: {
          requestId: `nft-invite-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };
    
    // Create the calendar event
    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: event,
    });
    
    // If the attendee email is provided but we don't want Google to send the invite,
    // manually send an email with the iCal attachment
    if (attendeeEmail && !sendEmail && createdEvent.data.htmlLink) {
      // Create iCal file
      const cal = ical({
        domain: 'vibehouse.xyz',
        name: 'NFT Calendar Invite',
      });
      
      const meetLink = createdEvent.data.hangoutLink || createdEvent.data.htmlLink;
      
      cal.createEvent({
        start: new Date(start),
        end: new Date(end),
        summary: summary,
        description: `${description || ''}\n\nJoin the meeting: ${meetLink}`,
        location: meetLink,
        url: meetLink,
        organizer: {
          name: userInfo.data.name || 'Calendar Host',
          email: userEmail || '',
        },
        attendees: [
          {
            name: 'Recipient',
            email: attendeeEmail,
            rsvp: true,
          },
        ],
      });
      
      // Send email with iCal attachment
      // In a production app, you would use a proper email service
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || userEmail,
          to: attendeeEmail,
          subject: `Meeting Invitation: ${summary}`,
          text: `You have been invited to a meeting: ${summary}\n\nTime: ${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}\n\nJoin the meeting: ${meetLink}\n\n${description || ''}`,
          html: `
            <h1>Meeting Invitation</h1>
            <h2>${summary}</h2>
            <p><strong>Time:</strong> ${new Date(start).toLocaleString()} - ${new Date(end).toLocaleString()}</p>
            <p><strong>Join:</strong> <a href="${meetLink}">${meetLink}</a></p>
            ${description ? `<p>${description}</p>` : ''}
            <p>This invitation was sent via an NFT Calendar Invite.</p>
          `,
          icalEvent: {
            filename: 'invite.ics',
            method: 'REQUEST',
            content: cal.toString(),
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      event: createdEvent.data,
      htmlLink: createdEvent.data.htmlLink,
      meetLink: createdEvent.data.hangoutLink,
    });
  } catch (error) {
    console.error('Calendar event creation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 