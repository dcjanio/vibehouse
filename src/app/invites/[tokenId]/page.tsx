'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import AddToCalendarButton from '@/components/AddToCalendarButton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Invite {
  id: number;
  token_id: string;
  sender_address: string;
  recipient_address: string;
  recipient_email?: string;
  topic: string;
  duration: number;
  created_at: string;
}

export default function InviteDetailPage() {
  const { tokenId } = useParams();
  const { address } = useAccount();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      if (!tokenId) return;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('calendar_invites')
          .select('*')
          .eq('token_id', tokenId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          notFound();
        }

        setInvite(data);
      } catch (err) {
        console.error('Error fetching invite:', err);
        setError('Failed to load invite details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-4">{error || 'Invite not found'}</p>
        <Link href="/" className="mt-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Back to Home
        </Link>
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const isSender = address?.toLowerCase() === invite.sender_address.toLowerCase();
  const isRecipient = address?.toLowerCase() === invite.recipient_address.toLowerCase();
  const createdDate = new Date(invite.created_at);

  return (
    <div className="min-h-screen max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <h1 className="text-3xl font-bold text-white">NFT Calendar Invite</h1>
          <p className="text-white/80 mt-2">
            Token ID: {invite.token_id}
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">{invite.topic}</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                  <p className="mt-1 text-lg">{invite.duration} minutes</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-lg">
                    {formatDistanceToNow(createdDate, { addSuffix: true })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {createdDate.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">From</h3>
                  <p className="mt-1 font-mono bg-gray-100 p-2 rounded">
                    {formatAddress(invite.sender_address)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">To</h3>
                  <p className="mt-1 font-mono bg-gray-100 p-2 rounded">
                    {formatAddress(invite.recipient_address)}
                  </p>
                  {invite.recipient_email && (
                    <p className="mt-1 text-sm text-gray-500">
                      {invite.recipient_email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <AddToCalendarButton 
              topic={invite.topic}
              duration={invite.duration}
              tokenId={invite.token_id}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            />
            
            {isRecipient && (
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Accept Invite
              </button>
            )}
            
            <Link href="/" className="px-4 py-2 border border-gray-300 rounded text-center hover:bg-gray-50">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 