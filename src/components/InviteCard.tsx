'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CalendarInvite {
  id: string;
  token_id: number;
  sender_address: string;
  recipient_address: string;
  recipient_email?: string;
  topic: string;
  duration: number;
  expiration: number;
  is_redeemed: boolean;
  meeting_time?: string;
  meeting_url?: string;
  created_at: string;
}

interface InviteCardProps {
  invite: CalendarInvite;
  currentAddress: string;
}

export default function InviteCard({ invite, currentAddress }: InviteCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Check if the current user is the sender
  const isSender = invite.sender_address.toLowerCase() === currentAddress.toLowerCase();
  
  // Format an address for display
  const formatAddress = (address: string): string => {
    if (!address || address === '0x0000000000000000000000000000000000000000') return 'Unknown';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get the status of the invite
  const getInviteStatus = () => {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    if (invite.is_redeemed) {
      return { 
        label: 'Booked', 
        className: 'bg-blue-500/10 border-blue-500 text-blue-400' 
      };
    }
    
    if (invite.expiration < currentTimestamp) {
      return { 
        label: 'Expired', 
        className: 'bg-yellow-500/10 border-yellow-500 text-yellow-400' 
      };
    }
    
    return { 
      label: 'Active', 
      className: 'bg-green-500/10 border-green-500 text-green-400' 
    };
  };
  
  const status = getInviteStatus();
  
  // Format a date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Format a datetime for display
  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  return (
    <div 
      className={`p-4 rounded-lg border ${
        expanded ? 'bg-gray-800/80 border-gray-600' : 'bg-gray-800 border-gray-700'
      } hover:border-gray-600 transition-colors`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium">NFT #{invite.token_id}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isSender ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {isSender ? 'Sent' : 'Received'}
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${status.className}`}>
          {status.label}
        </span>
      </div>
      
      <h3 className="font-medium text-lg mt-2">{invite.topic}</h3>
      
      <div className="mt-2 text-sm text-gray-400">
        <div className="flex justify-between">
          <span>Duration:</span>
          <span className="text-gray-300">{invite.duration} minutes</span>
        </div>
        
        <div className="flex justify-between mt-1">
          <span>{invite.is_redeemed ? 'Redeemed:' : 'Valid until:'}</span>
          <span className="text-gray-300">
            {invite.is_redeemed 
              ? 'Yes' 
              : formatDate(invite.expiration)
            }
          </span>
        </div>
        
        <div className="flex justify-between mt-1">
          <span>{isSender ? 'Recipient:' : 'Sender:'}</span>
          <span className="text-gray-300">
            {isSender 
              ? formatAddress(invite.recipient_address) 
              : formatAddress(invite.sender_address)
            }
          </span>
        </div>
        
        {expanded && (
          <>
            {invite.recipient_email && (
              <div className="flex justify-between mt-1">
                <span>Email:</span>
                <span className="text-gray-300">{invite.recipient_email}</span>
              </div>
            )}
            
            {invite.is_redeemed && invite.meeting_time && (
              <div className="flex justify-between mt-1">
                <span>Meeting time:</span>
                <span className="text-gray-300">{formatDateTime(invite.meeting_time)}</span>
              </div>
            )}
            
            {invite.is_redeemed && invite.meeting_url && (
              <div className="flex justify-between mt-1">
                <span>Meeting URL:</span>
                <a 
                  href={invite.meeting_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 truncate"
                >
                  Join Meeting
                </a>
              </div>
            )}
            
            <div className="flex justify-between mt-1">
              <span>Created:</span>
              <span className="text-gray-300">{formatDateTime(invite.created_at)}</span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-gray-400 hover:text-white"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
        
        {!isSender && !invite.is_redeemed && invite.expiration > Math.floor(Date.now() / 1000) && (
          <Link
            href={`/redeem/${invite.token_id}`}
            className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
          >
            Redeem
          </Link>
        )}
      </div>
    </div>
  );
} 