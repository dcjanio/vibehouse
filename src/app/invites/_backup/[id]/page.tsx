'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import AddToCalendarButton from '@/components/AddToCalendarButton';

type InviteDetails = {
  id: number;
  token_id: string;
  sender_address: string;
  recipient_address: string;
  topic: string;
  duration: number;
  email?: string;
  created_at: string;
};

export default function InviteDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { address } = useAccount();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInviteDetails() {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const { data, error } = await supabase
          .from('calendar_invites')
          .select('*')
          .eq('token_id', id)
          .single();
        
        if (error) {
          console.error('Error fetching invite:', error);
          setError('Failed to load invite details.');
          return;
        }
        
        if (!data) {
          setError('Invite not found.');
          return;
        }
        
        // Check if user is authorized to view this invite
        if (address && 
            data.sender_address.toLowerCase() !== address.toLowerCase() && 
            data.recipient_address.toLowerCase() !== address.toLowerCase()) {
          setError('You are not authorized to view this invite.');
          return;
        }
        
        setInvite(data);
      } catch (err) {
        console.error('Failed to fetch invite details:', err);
        setError('An error occurred while loading the invite details.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInviteDetails();
  }, [id, address]);
  
  function truncateAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  
  const isRecipient = address && invite?.recipient_address?.toLowerCase() === address.toLowerCase();
  const isSender = address && invite?.sender_address?.toLowerCase() === address.toLowerCase();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-20 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <Link href="/invites" className="text-blue-500 hover:underline">
          ← Back to invites
        </Link>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-700">Invite not found.</p>
        </div>
        <Link href="/invites" className="text-blue-500 hover:underline">
          ← Back to invites
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/invites" className="text-blue-500 hover:underline">
          ← Back to invites
        </Link>
      </div>
      
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">{invite.topic}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">From</h2>
            <p className="font-mono mb-1">{truncateAddress(invite.sender_address)}</p>
            {isSender && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>}
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">To</h2>
            <p className="font-mono mb-1">{truncateAddress(invite.recipient_address)}</p>
            {isRecipient && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">You</span>}
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Duration</h2>
            <p>{invite.duration} minutes</p>
          </div>
          
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Token ID</h2>
            <p className="font-mono">{invite.token_id}</p>
          </div>
          
          {invite.email && (
            <div className="col-span-2">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Email</h2>
              <p>{invite.email}</p>
            </div>
          )}
          
          <div className="col-span-2">
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-2">Created</h2>
            <p>{new Date(invite.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {isRecipient && (
          <AddToCalendarButton 
            topic={invite.topic}
            duration={invite.duration}
            tokenId={invite.token_id}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-center"
          />
        )}
        
        <Link 
          href={`https://etherscan.io/token/0xYourContractAddress?a=${invite.token_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition text-center"
        >
          View on Etherscan
        </Link>
      </div>
    </div>
  );
} 