'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { useAccount } from 'wagmi';

export default function FarcasterFrame() {
  const [fid, setFid] = useState<number | null>(null);
  const [isFrameSupported, setIsFrameSupported] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    // Check if the app is running in a Farcaster client
    const checkFrameContext = async () => {
      try {
        // In @farcaster/frame-sdk v0.0.34, getContext is not available
        // Instead, we try to detect Farcaster context in a different way
        const isFarcaster = 
          typeof window !== 'undefined' && 
          (window.location.href.includes('warpcast') || 
           window.navigator.userAgent.toLowerCase().includes('farcaster'));
        
        if (isFarcaster) {
          // Try to get FID from window.frame
          const frameFid = typeof window !== 'undefined' ? (window as any).frame?.fid : null;
          if (frameFid) {
            setFid(frameFid);
          }
          setIsFrameSupported(true);
        }
      } catch (error) {
        console.error('Not in a Farcaster Frame context:', error);
        setIsFrameSupported(false);
      }
    };

    checkFrameContext();
  }, []);

  const handleViewInvites = async () => {
    try {
      // Navigate to the invites page within the Farcaster client
      // Instead of using sdk.openURL, we use standard navigation
      window.location.href = '/invites';
    } catch (error) {
      console.error('Error navigating:', error);
      window.location.href = '/invites';
    }
  };

  const handleSendInvite = async () => {
    try {
      // If the user has a connected wallet, navigate to the main page
      // Otherwise, prompt them to connect their wallet
      if (address) {
        window.location.href = '/';
      } else {
        // Show a message instructing them to connect their wallet
        alert('Please connect your wallet first to send an invite');
      }
    } catch (error) {
      console.error('Error navigating:', error);
      window.location.href = '/';
    }
  };

  // If not in a Farcaster client, don't render anything
  if (!isFrameSupported) return null;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-xl font-bold text-accent mb-4">NFT Calendar Invite</h2>
      <p className="text-gray-400 mb-6">Schedule meetings using web3 calendar invites</p>
      
      <div className="space-y-4">
        <button
          onClick={handleSendInvite}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Send Calendar Invite
        </button>
        
        <button
          onClick={handleViewInvites}
          className="w-full bg-gray-700 text-white py-3 px-4 rounded hover:bg-gray-600 transition-colors"
        >
          View My Invites
        </button>
      </div>
      
      {fid && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Connected as Farcaster user ID: {fid}
        </div>
      )}
    </div>
  );
} 