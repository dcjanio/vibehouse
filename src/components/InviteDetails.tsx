import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { formatDate, formatDuration } from '@/lib/utils';
import AddToCalendarButton from './AddToCalendarButton';

interface InviteDetailsProps {
  tokenId: string;
}

interface InviteData {
  tokenId: string;
  sender_address: string;
  recipient_address: string;
  topic: string;
  duration: number;
  validity_period: number;
  created_at: string;
  redeemed: boolean;
  redemption_time: string | null;
  recipient_email: string | null;
  calendar_event_id: string | null;
  start_time: string | null;
}

export default function InviteDetails({ tokenId }: InviteDetailsProps) {
  const { address } = useAccount();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenId) return;

    const fetchInvite = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/invites?tokenId=${tokenId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch invite: ${response.statusText}`);
        }
        
        const data = await response.json();
        setInvite(data);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch invite details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [tokenId]);

  const isOwner = address && invite && (
    address.toLowerCase() === invite.sender_address.toLowerCase() || 
    address.toLowerCase() === invite.recipient_address.toLowerCase()
  );

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Error Loading Invite</h2>
        <p className="text-gray-700">{error || 'Invite not found'}</p>
      </div>
    );
  }

  // Format validity period (timestamp to human-readable date)
  const validUntil = new Date(invite.validity_period * 1000);
  const isValid = validUntil > new Date();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">{invite.topic}</h2>
        <div className={`px-3 py-1 rounded text-sm font-semibold ${
          invite.redeemed 
            ? 'bg-blue-100 text-blue-800' 
            : isValid 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
        }`}>
          {invite.redeemed 
            ? 'Redeemed' 
            : isValid 
              ? 'Active' 
              : 'Expired'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">From</p>
            <p className="font-medium break-all">{invite.sender_address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">To</p>
            <p className="font-medium break-all">{invite.recipient_address}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">{formatDuration(invite.duration)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created on</p>
            <p className="font-medium">{formatDate(invite.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Valid until</p>
            <p className="font-medium">{formatDate(invite.validity_period * 1000)}</p>
          </div>
          {invite.redeemed && invite.redemption_time && (
            <div>
              <p className="text-sm text-gray-500">Redeemed on</p>
              <p className="font-medium">{formatDate(invite.redemption_time)}</p>
            </div>
          )}
        </div>

        {invite.recipient_email && (
          <div>
            <p className="text-sm text-gray-500">Recipient Email</p>
            <p className="font-medium">{invite.recipient_email}</p>
          </div>
        )}

        {invite.start_time && (
          <div>
            <p className="text-sm text-gray-500">Meeting Time</p>
            <p className="font-medium">{formatDate(invite.start_time)}</p>
          </div>
        )}

        {isOwner && invite.calendar_event_id && (
          <div className="mt-4">
            <a 
              href={`https://calendar.google.com/calendar/event?eid=${invite.calendar_event_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
            >
              View in Google Calendar
            </a>
          </div>
        )}

        {isOwner && isValid && !invite.start_time && (
          <div className="mt-4">
            <AddToCalendarButton 
              tokenId={tokenId}
              topic={invite.topic}
              duration={invite.duration}
              className="inline-block px-4 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600 transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
} 