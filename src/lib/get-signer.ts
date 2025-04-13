import { BrowserProvider } from 'ethers';

/**
 * Get a signer object for interacting with the blockchain
 * @returns A promise that resolves to an ethers.js signer or null if not available
 */
async function getSigner() {
  // Check if we're in a browser environment with window.ethereum available
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Create a browser provider (ethers v6 syntax)
      const provider = new BrowserProvider(window.ethereum);
      
      // Request user account access if needed
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get the signer from the provider
      const signer = await provider.getSigner();
      
      return signer;
    } catch (error) {
      console.error('Error getting signer:', error);
      return null;
    }
  }
  
  console.warn('No ethereum provider available');
  return null;
}

export default getSigner; 