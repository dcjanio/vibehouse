'use client';

import { useState } from 'react';

interface ManualTokenInputProps {
  onSubmit: (tokenId: string) => void;
  isLoading?: boolean;
}

export default function ManualTokenInput({ onSubmit, isLoading = false }: ManualTokenInputProps) {
  const [tokenId, setTokenId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!tokenId.trim()) {
      setError('Please enter a token ID');
      return;
    }
    
    // Check if it's a valid number
    if (!/^\d+$/.test(tokenId.trim())) {
      setError('Token ID must be a valid number');
      return;
    }
    
    onSubmit(tokenId.trim());
  };

  return (
    <div className="w-full mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-medium mb-2">Load Invite by Token ID</h3>
      <p className="text-gray-400 text-sm mb-4">
        Have a token ID? Enter it below to view the invite details.
      </p>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-grow">
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter token ID"
            className="w-full px-3 py-2 bg-gray-900 rounded-md border border-gray-700 focus:border-blue-500 focus:outline-none"
            disabled={isLoading}
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 rounded-md font-medium ${
            isLoading 
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Loading...' : 'Load Invite'}
        </button>
      </form>
    </div>
  );
} 