import { sdk } from '@farcaster/frame-sdk';

export async function resolveFarcasterUsername(username: string): Promise<string | null> {
  try {
    // Remove @ if present
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    
    // Use Farcaster API directly
    const response = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`);
    const data = await response.json();
    
    if (!data.result || !data.result.verifiedAddresses) {
      return null;
    }

    // Get the first verified Ethereum address
    const ethAddress = data.result.verifiedAddresses.find(
      (addr: any) => addr.type === 'Ethereum'
    );

    return ethAddress?.address || null;
  } catch (error) {
    console.error('Error resolving Farcaster username:', error);
    return null;
  }
}

export async function validateFarcasterUsername(username: string): Promise<boolean> {
  try {
    const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
    const response = await fetch(`https://api.farcaster.xyz/v2/user-by-username?username=${cleanUsername}`);
    const data = await response.json();
    return !!data.result;
  } catch (error) {
    console.error('Error validating Farcaster username:', error);
    return false;
  }
}

export function getFrameContext() {
  return {
    fid: typeof window !== 'undefined' ? (window as any).frame?.fid : null,
    walletAddress: typeof window !== 'undefined' ? (window as any).frame?.connectedAddress : null,
    castId: typeof window !== 'undefined' ? (window as any).frame?.castId : null,
    buttonIndex: typeof window !== 'undefined' ? (window as any).frame?.buttonIndex : null
  };
} 