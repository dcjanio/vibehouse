'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

type CalendarInvite = {
  id: number;
  token_id: string;
  sender_address: string;
  recipient_address: string;
  topic: string;
  duration: number;
  email?: string;
  created_at: string;
};

export default function InvitesList() {
  const { address } = useAccount();
  const [invites, setInvites] = useState<CalendarInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  useEffect(() => {
    async function fetchInvites() {
      if (!address) return;
      
      setLoading(true);
      
      try {
        let query = supabase
          .from('calendar_invites')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (filter === 'sent') {
          query = query.eq('sender_address', address);
        } else if (filter === 'received') {
          query = query.eq('recipient_address', address);
        } else {
          // For 'all', show invites where the user is either sender or recipient
          query = query.or(`sender_address.eq.${address},recipient_address.eq.${address}`);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching invites:', error);
          return;
        }
        
        setInvites(data || []);
      } catch (err) {
        console.error('Failed to fetch invites:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchInvites();
  }, [address, filter]);
  
  if (!address) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">Please connect your wallet to view your invites.</p>
      </div>
    );
  }
  
  if (loading) {
    return <div className="text-center p-4">Loading invites...</div>;
  }
  
  if (invites.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">No invites found.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
          Create a new invite
        </Link>
      </div>
    );
  }
  
  function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('sent')}
        >
          Sent
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'received' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          onClick={() => setFilter('received')}
        >
          Received
        </button>
      </div>
      
      <div className="space-y-4">
        {invites.map((invite) => (
          <Link 
            href={`/invites/${invite.token_id}`} 
            key={invite.id}
            className="block border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">{invite.topic}</h3>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {invite.sender_address.toLowerCase() === address?.toLowerCase() ? (
                <p>To: {truncateAddress(invite.recipient_address)}</p>
              ) : (
                <p>From: {truncateAddress(invite.sender_address)}</p>
              )}
            </div>
            
            <div className="mt-1 flex justify-between items-center">
              <span className="text-sm text-gray-500">Duration: {invite.duration} minutes</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                ID: {invite.token_id}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 