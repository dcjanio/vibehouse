'use client';

import { useState } from 'react';

interface ManualTokenInputProps {
  onTokenSubmit: (tokenId: number) => void;
}

export default function ManualTokenInput({ onTokenSubmit }: ManualTokenInputProps) {
  const [tokenId, setTokenId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tokenId.trim()) {
      setError('Please enter a token ID');
      return;
    }

    const parsedTokenId = parseInt(tokenId.trim(), 10);
    if (isNaN(parsedTokenId) || parsedTokenId < 0) {
      setError('Please enter a valid token ID (positive number)');
      return;
    }

    onTokenSubmit(parsedTokenId);
    setTokenId('');
  };

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-sm mb-2">
        You can manually enter your token ID if you know it:
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter token ID (e.g. 1)"
            className="bg-gray-900 px-3 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none w-full"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            View Invite
          </button>
        </div>
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
      </form>
    </div>
  );
} 