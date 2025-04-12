import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

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

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const durationMinutes = parseInt(searchParams.get('duration') || '30', 10);
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    // Validate parameters
    if (isNaN(durationMinutes) || durationMinutes < 15 || durationMinutes > 120) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be between 15 and 120 minutes.' },
        { status: 400 }
      );
    }
    
    if (isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 30.' },
        { status: 400 }
      );
    }
    
    // Get authenticated client
    const auth = getAuthenticatedClient();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Set the time boundary for availability search
    const now = new Date();
    const timeMin = now.toISOString();
    
    const endDate = new Date();
    endDate.setDate(now.getDate() + days);
    const timeMax = endDate.toISOString();
    
    // Get busy times from the primary calendar
    const busyTimes = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    });
    
    // Extract busy slots
    const busy = busyTimes.data.calendars?.primary?.busy || [];
    
    // Calculate available slots (simple implementation)
    const availableSlots = [];
    
    // Working hours: 9 AM to 5 PM
    const workingHoursStart = 9;  // 9 AM
    const workingHoursEnd = 17;   // 5 PM
    
    // Generate possible time slots for the specified number of days
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(now.getDate() + day + 1); // Start from tomorrow
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate slots during working hours
      for (let hour = workingHoursStart; hour < workingHoursEnd; hour++) {
        // Only create slots at the beginning of the hour for simplicity
        date.setHours(hour, 0, 0, 0);
        
        const slotStart = new Date(date);
        const slotEnd = new Date(date);
        slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);
        
        // Don't offer slots that would go beyond working hours
        if (slotEnd.getHours() > workingHoursEnd) continue;
        
        // Check if this slot overlaps with any busy time
        const isAvailable = !busy.some(busySlot => {
          const busyStart = new Date(busySlot.start);
          const busyEnd = new Date(busySlot.end);
          
          // Check for overlap
          return (
            (slotStart >= busyStart && slotStart < busyEnd) || // Slot starts during busy time
            (slotEnd > busyStart && slotEnd <= busyEnd) ||     // Slot ends during busy time
            (slotStart <= busyStart && slotEnd >= busyEnd)     // Slot completely contains busy time
          );
        });
        
        if (isAvailable) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
          });
        }
      }
    }
    
    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error('Calendar availability error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 