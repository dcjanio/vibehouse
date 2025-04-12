'use client';

import { FC, useState } from 'react';
import { useAccount, useContractWrite, usePrepareContractWrite } from 'wagmi';

interface MintFormProps {
  contractAddress: string;
}

export const MintForm: FC<MintFormProps> = ({ contractAddress }) => {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    recipient: '',
    topic: '',
    duration: 30,
    expiration: '',
  });
  const [isResolving, setIsResolving] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecipientChange = async (username: string) => {
    setFormData({ ...formData, recipient: username });
    setError(null);
    setRecipientAddress(null);

    if (username.length > 0) {
      setIsResolving(true);
      try {
        const response = await fetch(`/api/resolve-username?username=${encodeURIComponent(username)}`);
        const data = await response.json();

        if (response.ok) {
          setRecipientAddress(data.address);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to resolve username');
      } finally {
        setIsResolving(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress) {
      setError('Please enter a valid Farcaster username');
      return;
    }
    // TODO: Implement minting logic
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Recipient (Farcaster Username)
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="@username"
            required
          />
          {isResolving && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        {recipientAddress && (
          <p className="mt-1 text-sm text-green-600">
            Resolved to: {recipientAddress}
          </p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Meeting Topic
        </label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Duration (minutes)
        </label>
        <select
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Valid Until
        </label>
        <input
          type="date"
          value={formData.expiration}
          onChange={(e) => setFormData({ ...formData, expiration: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={!recipientAddress || isResolving}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Mint Calendar Invite NFT
      </button>
    </form>
  );
}; 