'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addMinutes } from 'date-fns';

interface AddToCalendarButtonProps {
  topic: string;
  duration: number;
  tokenId: string;
  className?: string;
}

export default function AddToCalendarButton({ 
  topic, 
  duration, 
  tokenId,
  className = ''
}: AddToCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useGoogle, setUseGoogle] = useState(false);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is authenticated with Google
  useEffect(() => {
    const checkGoogleAuth = async () => {
      setCheckingAuth(true);
      try {
        const response = await fetch('/api/google/auth/status');
        if (response.ok) {
          const data = await response.json();
          setIsGoogleAuthenticated(data.authenticated || false);
        }
      } catch (err) {
        console.error('Error checking Google auth status:', err);
        setIsGoogleAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkGoogleAuth();
  }, []);

  const handleGoogleAuth = () => {
    // Store current URL to return after auth
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/api/google/auth?returnTo=${encodeURIComponent(returnUrl)}`;
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      setStartDate(new Date(dateValue));
    } else {
      setStartDate(null);
    }
  };

  const createGoogleCalendarEvent = async () => {
    if (!startDate) {
      setError('Please select a date and time first');
      return;
    }

    if (!isGoogleAuthenticated) {
      handleGoogleAuth();
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Fetch invite details to get email if available
      const { data: invite, error: fetchError } = await supabase
        .from('calendar_invites')
        .select('*')
        .eq('token_id', tokenId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Calculate end time
      const endTime = addMinutes(startDate, duration);
      
      // Create event through our API
      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startDate.toISOString(),
          end: endTime.toISOString(),
          summary: topic,
          description: `NFT Calendar Invite #${tokenId}`,
          attendeeEmail: invite.recipient_email,
          tokenId: tokenId,
          sendEmail: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for authentication errors
        if (errorData.error && errorData.error.includes('Not authenticated with Google')) {
          // Clear auth status and redirect to auth
          setIsGoogleAuthenticated(false);
          handleGoogleAuth();
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create calendar event');
      }

      const data = await response.json();
      
      // Update the invite in Supabase with the event ID and start time
      const { error: updateError } = await supabase
        .from('calendar_invites')
        .update({ 
          start_time: startDate.toISOString(),
          calendar_event_id: data.event.id
        })
        .eq('token_id', tokenId);
        
      if (updateError) {
        console.error('Error updating invite with event details:', updateError);
      }
      
      setSuccess('Calendar event created successfully!');
      setShowDatePicker(false);
    } catch (err) {
      console.error('Error creating calendar event:', err);
      
      // Check if it's an authentication error
      if (err instanceof Error && err.message.includes('Not authenticated with Google')) {
        // Reset auth state and redirect
        setIsGoogleAuthenticated(false);
        handleGoogleAuth();
        return;
      }
      
      setError('Failed to create calendar event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createLocalCalendarEvent = async () => {
    if (!startDate) {
      setError('Please select a date and time first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Fetch invite details to get email if available
      const { data: invite, error: fetchError } = await supabase
        .from('calendar_invites')
        .select('*')
        .eq('token_id', tokenId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Calculate end time
      const endTime = addMinutes(startDate, duration);
      
      // Format dates for Google Calendar URL
      const formattedStart = format(startDate, "yyyyMMdd'T'HHmmss");
      const formattedEnd = format(endTime, "yyyyMMdd'T'HHmmss");

      // Create Google Calendar URL
      let calendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
      
      // Add event title
      calendarUrl += `&text=${encodeURIComponent(topic)}`;
      
      // Add start and end time
      calendarUrl += `&dates=${formattedStart}/${formattedEnd}`;
      
      // Add description with NFT details
      const description = `NFT Calendar Invite
Token ID: ${tokenId}
Duration: ${duration} minutes`;
      calendarUrl += `&details=${encodeURIComponent(description)}`;
      
      // Add attendees if email is available
      if (invite.recipient_email) {
        calendarUrl += `&add=${encodeURIComponent(invite.recipient_email)}`;
      }
      
      // Update the invite in Supabase with the selected start time
      const { error: updateError } = await supabase
        .from('calendar_invites')
        .update({ start_time: startDate.toISOString() })
        .eq('token_id', tokenId);
        
      if (updateError) {
        console.error('Error updating invite with start time:', updateError);
      }
      
      // Open calendar in new tab
      window.open(calendarUrl, '_blank');
      
      setSuccess('Calendar link opened successfully!');
      setShowDatePicker(false);
    } catch (err) {
      console.error('Error opening calendar:', err);
      setError('Failed to open calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {success && <p className="text-green-500 text-sm">{success}</p>}
      
      {!showDatePicker ? (
        <button
          onClick={() => setShowDatePicker(true)}
          className={`${className}`}
        >
          Add to Calendar
        </button>
      ) : (
        <>
          <div className="flex flex-col space-y-2">
            <label htmlFor="startDateTime" className="text-sm font-medium text-gray-700">
              Select date and time:
            </label>
            <input
              type="datetime-local"
              id="startDateTime"
              onChange={handleDateSelect}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                checked={!useGoogle}
                onChange={() => setUseGoogle(false)}
                name="calendarType"
              />
              <span className="ml-2">Quick Calendar Link (No Authentication)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                checked={useGoogle}
                onChange={() => setUseGoogle(true)}
                name="calendarType"
                disabled={checkingAuth || !isGoogleAuthenticated}
              />
              <span className="ml-2">
                Google Calendar API {checkingAuth ? '(Checking...)' : !isGoogleAuthenticated ? '(Not Authenticated)' : ''}
              </span>
            </label>
            {useGoogle && !isGoogleAuthenticated && !checkingAuth && (
              <div className="ml-6">
                <button 
                  onClick={handleGoogleAuth}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Sign in with Google Calendar
                </button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={useGoogle ? createGoogleCalendarEvent : createLocalCalendarEvent}
              disabled={isLoading || !startDate || (useGoogle && !isGoogleAuthenticated)}
              className={`${className} ${(isLoading || !startDate || (useGoogle && !isGoogleAuthenticated)) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Processing...' : (useGoogle ? 'Create Calendar Event' : 'Open Calendar Link')}
            </button>
            
            <button
              onClick={() => {
                setShowDatePicker(false);
                setStartDate(null);
                setError('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </>
      )}
      
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
} 