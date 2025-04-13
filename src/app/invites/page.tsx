'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSearchParams, useRouter } from 'next/navigation';
import { storeInvite, getSentInvites, getReceivedInvites, redeemInvite, verifyTokenOwnership, getAllInvites, getAllInvitesByAddress } from '@/lib/supabase';
import { CalendarInvite } from '@/lib/supabase';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig, chains } from '@/lib/wagmi-config';
import '@rainbow-me/rainbowkit/styles.css';
import Link from 'next/link';

// Create a NoSSR component to prevent hydration issues
const NoSSR = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <>{children}</>;
};

export default function InvitesPage() {
  return (
    <NoSSR>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <InvitesContent />
        </RainbowKitProvider>
      </WagmiConfig>
    </NoSSR>
  );
}

function InvitesContent() {
  const { address, isConnected } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sent');
  const [sentInvites, setSentInvites] = useState<CalendarInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CalendarInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<CalendarInvite | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // State for calendar and scheduling
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [tokenIdInput, setTokenIdInput] = useState('');
  
  // Time slots
  const timeSlots = [
    "07:30", "08:30", "09:00", "09:30", 
    "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  // Admin wallet address
  const ADMIN_ADDRESS = '0x614220b724070f274D0DBeB3D42ED2804aF488c7';
  
  // Check if current wallet is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Check for transaction hash in URL
  useEffect(() => {
    const txHash = searchParams.get('txHash');
    if (txHash) {
      setSuccess(`Transaction successful! Hash: ${txHash}`);
    }
  }, [searchParams]);

  // Check Supabase connection on initial load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { testSupabaseConnection } = await import('@/lib/supabase');
        const result = await testSupabaseConnection();
        console.log('Supabase connection test result:', result);
        
        if (result.connected) {
          const message = result.tableData 
            ? `Connected to Supabase. Found ${result.tableData.count?.[0]?.count || 0} invites.` 
            : 'Connected to Supabase, but calendar_invites table may not exist.';
          
          setConnectionStatus({
            connected: true,
            message,
            details: result
          });
        } else {
          setConnectionStatus({
            connected: false,
            message: 'Failed to connect to Supabase',
            details: result.error
          });
        }
      } catch (error) {
        console.error('Error testing Supabase connection:', error);
        setConnectionStatus({
          connected: false,
          message: 'Error testing Supabase connection',
          details: error
        });
      }
    };
    
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchInvites();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchInvites = async () => {
    if (!address) return;
    
    setLoading(true);
    setError('');
    
    try {
      // For admin account, fetch sent invites
      if (isAdmin) {
        console.log('Fetching sent invites for admin address:', address);
        const sentData = await getSentInvites(address);
        console.log('Sent invites data:', sentData);
        setSentInvites(sentData || []);
      }
      
      // For all accounts, fetch received invites
      console.log('Fetching received invites for address:', address);
      const receivedData = await getReceivedInvites(address);
      console.log('Received invites data:', receivedData);
      setReceivedInvites(receivedData || []);
      
      // If both are empty, try the combined backup method
      if ((!isAdmin || sentInvites.length === 0) && receivedInvites.length === 0) {
        console.log('No invites found with standard queries, trying combined method...');
        const allData = await getAllInvitesByAddress(address);
        console.log('All invites by address:', allData);
        
        if (allData && allData.length > 0) {
          // Only filter sent invites for admin
          if (isAdmin) {
            const sent = allData.filter(invite => 
              invite.sender_address.toLowerCase() === address.toLowerCase()
            );
            console.log('Filtered sent invites:', sent);
            if (sent.length > 0) setSentInvites(sent);
          }
          
          // Filter received invites for all users
          const received = allData.filter(invite => 
            invite.recipient_address.toLowerCase() === address.toLowerCase()
          );
          console.log('Filtered received invites:', received);
          if (received.length > 0) setReceivedInvites(received);
        }
      }
      
      // Set default active tab based on user type
      if (isAdmin) {
        setActiveTab('sent');
      } else {
        setActiveTab('received');
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
      setError('Failed to load invites. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedInvite || !selectedDate || !selectedTime) {
      setError('Please select a date and time for your meeting');
      return;
    }

    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    setEmailError('');
    
    // Format date and time to ISO format
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    
    const scheduledDateTime = `${year}-${month}-${day}T${selectedTime}:00`;
    
    try {
      // Update the invite in Supabase with scheduled time and email
      await redeemInvite(
        selectedInvite.token_id, 
        scheduledDateTime,
        email
      );
      
      // Add interaction with the NFT contract here - marking as redeemed
      // This would typically call a contract function to mark the NFT as redeemed
      try {
        // Import contract interaction utilities
        const { getContract } = await import('@/lib/contracts');
        const signer = await import('@/lib/get-signer').then(mod => mod.default());
        
        if (signer) {
          const contract = getContract(signer);
          
          // Call the contract's redeem function
          // Note: This assumes your contract has a redeemInvite function
          // Adjust based on your actual contract implementation
          const tx = await contract.redeemInvite(selectedInvite.token_id);
          await tx.wait();
          
          setSuccess(`Meeting scheduled successfully for ${day}/${month}/${year} at ${selectedTime}! NFT has been redeemed.`);
        } else {
          // If we can't get the signer, still mark as success but note the contract interaction failed
          setSuccess(`Meeting scheduled successfully for ${day}/${month}/${year} at ${selectedTime}! (Note: NFT contract interaction failed, but your booking is confirmed)`);
        }
      } catch (contractErr) {
        console.error('Error interacting with contract:', contractErr);
        // Still mark as success if Supabase update worked, even if contract interaction failed
        setSuccess(`Meeting scheduled successfully for ${day}/${month}/${year} at ${selectedTime}! (Note: NFT marking failed, but your booking is confirmed)`);
      }
      
      setSelectedInvite(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setEmail('');
      await fetchInvites();
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      setError('Failed to schedule meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Adjust for Sunday as first day of week
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }
    
    return days;
  };

  // Check if a day is in the past
  const isPastDay = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatAddress = (address: string) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  };

  const checkTokenId = async () => {
    if (!tokenIdInput) return;
    
    try {
      const invite = await verifyTokenOwnership(tokenIdInput);
      if (invite) {
        setSelectedInvite(invite);
        setSelectedDate(null);
        setSelectedTime(null);
        setEmail('');
        setEmailError('');
      } else {
        setError('Invite not found');
      }
    } catch (err) {
      console.error('Error checking token ID:', err);
      setError('Error checking token ID');
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-900 text-white min-h-screen">
        <h1 className="text-3xl font-bold mb-6">NFT Calendar Invites</h1>
        <p className="mb-4">Connect your wallet to see your invites</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">NFT Calendar Invites</h1>
      
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {/* Calendar Invite Selection UI */}
      {selectedInvite ? (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 text-white rounded-lg shadow-xl p-6 max-w-4xl w-full border border-blue-500">
            <h2 className="text-3xl font-bold mb-6 text-gradient bg-gradient-to-r from-blue-400 to-purple-500">Schedule Your Meeting</h2>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Calendar Column */}
              <div className="md:w-1/2">
                <div className="flex items-center justify-between mb-4">
                  <button 
                    onClick={goToPreviousMonth}
                    className="text-blue-400 hover:text-purple-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h3 className="text-xl font-medium text-blue-300">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  
                  <button 
                    onClick={goToNextMonth}
                    className="text-blue-400 hover:text-purple-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                    <div key={day} className="text-center font-medium text-blue-400 text-sm py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth().map((date, index) => (
                    <div key={index} className="text-center">
                      {date ? (
                        <button
                          onClick={() => setSelectedDate(date)}
                          disabled={isPastDay(date)}
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center text-lg
                            ${isPastDay(date) ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-blue-500 hover:bg-opacity-20'}
                            ${selectedDate && date.getDate() === selectedDate.getDate() && 
                              date.getMonth() === selectedDate.getMonth() && 
                              date.getFullYear() === selectedDate.getFullYear() 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <span className="w-12 h-12"></span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Email Input Section */}
                <div className="mt-6">
                  <label htmlFor="email" className="block text-sm font-medium text-blue-300 mb-2">
                    Your Email Address <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    placeholder="Enter your email address"
                    className="w-full bg-gray-800 border border-blue-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-lg shadow-blue-900/20"
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-pink-400">{emailError}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-400">
                    Your email is used to send you meeting details and reminders
                  </p>
                </div>
              </div>
              
              {/* Time Selection Column */}
              <div className="md:w-1/2 md:border-l md:border-gray-700 md:pl-8">
                {selectedDate ? (
                  <>
                    <h3 className="text-xl font-medium mb-4 text-blue-300">
                      {formatDateForDisplay(selectedDate)}
                    </h3>
                    
                    {!selectedTime ? (
                      <p className="text-blue-300 mb-4">Please select a time slot</p>
                    ) : null}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            p-4 border rounded-md text-center font-medium transition-colors
                            ${selectedTime === time 
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent' 
                              : 'border-gray-700 text-gray-200 hover:border-blue-400 hover:bg-gray-800'}
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-800 rounded-md border border-blue-700 shadow-lg shadow-blue-900/20">
                      <h4 className="font-medium text-blue-300 mb-2">Meeting Details</h4>
                      <p className="text-white">
                        <span className="font-semibold text-purple-300">Topic:</span> {selectedInvite.topic}
                      </p>
                      <p className="text-white mt-1">
                        <span className="font-semibold text-purple-300">Duration:</span> {selectedInvite.duration} minutes
                      </p>
                      <p className="text-white mt-1">
                        <span className="font-semibold text-purple-300">Invite ID:</span> #{selectedInvite.token_id}
                      </p>
                      <p className="mt-3 text-sm text-blue-300">
                        By scheduling this meeting, you will redeem your NFT invite token.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-center py-16">
                    <p className="text-blue-300">
                      Please select a date from the calendar to view available time slots
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-8 space-x-3">
              <button
                onClick={() => {
                  setSelectedInvite(null);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setEmail('');
                  setEmailError('');
                }}
                className="px-6 py-2 border border-gray-600 rounded-md font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleScheduleMeeting}
                disabled={!selectedDate || !selectedTime || !email || loading}
                className={`
                  px-6 py-2 rounded-md font-medium
                  ${!selectedDate || !selectedTime || !email || loading
                    ? 'bg-blue-500 bg-opacity-50 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all transform hover:scale-105'}
                `}
              >
                {loading ? 'Scheduling...' : 'Schedule Meeting'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main content (list of invites) */}
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
          </div>
        ) : (
          <>
            {isAdmin ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gradient bg-gradient-to-r from-blue-400 to-purple-500 inline-block">Invites You've Sent</h2>
                  <Link 
                    href="/" 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 font-semibold"
                  >
                    Create New Invite
                  </Link>
                </div>
                
                {sentInvites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sentInvites.map(invite => (
                      <div 
                        key={invite.token_id} 
                        className="p-4 bg-gray-800 border border-blue-700 rounded-lg shadow-lg hover:shadow-blue-900/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-white">Token #{invite.token_id}</h3>
                          <span className={`
                            px-2 py-1 text-xs rounded-full ${invite.is_redeemed 
                              ? 'bg-green-900 text-green-300 border border-green-700' 
                              : 'bg-yellow-900 text-yellow-300 border border-yellow-700'}
                          `}>
                            {invite.is_redeemed ? 'Redeemed' : 'Pending'}
                          </span>
                        </div>
                        
                        <p className="text-blue-300 mb-1"><span className="text-purple-300">Topic:</span> {invite.topic}</p>
                        <p className="text-blue-300 mb-1"><span className="text-purple-300">To:</span> {formatAddress(invite.recipient_address)}</p>
                        <p className="text-blue-300 mb-3"><span className="text-purple-300">Duration:</span> {invite.duration} minutes</p>
                        
                        {invite.is_redeemed && invite.scheduled_time ? (
                          <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800 rounded">
                            <p className="text-sm text-blue-300"><span className="font-semibold">Scheduled for:</span> {formatDate(invite.scheduled_time)}</p>
                            
                            {invite.recipient_email && (
                              <p className="text-sm text-blue-300 mt-1"><span className="font-semibold">Contact:</span> {invite.recipient_email}</p>
                            )}
                            
                            <button 
                              onClick={() => {
                                const event = {
                                  title: `Meeting: ${invite.topic}`,
                                  description: `Calendar invite from NFT #${invite.token_id}`,
                                  startTime: new Date(invite.scheduled_time),
                                  endTime: new Date(new Date(invite.scheduled_time).getTime() + invite.duration * 60000),
                                  location: 'Online Meeting'
                                };
                                
                                const startTime = event.startTime.toISOString().replace(/-|:|\.\d+/g, '');
                                const endTime = event.endTime.toISOString().replace(/-|:|\.\d+/g, '');
                                
                                const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
                                
                                window.open(calendarUrl, '_blank');
                              }}
                              className="mt-2 w-full py-1 px-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded flex items-center justify-center hover:from-green-600 hover:to-blue-600 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Add to Calendar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-800 border border-blue-700 rounded-lg text-center">
                    <p className="text-blue-300 mb-4">You haven't sent any invites yet</p>
                    <p className="text-sm text-gray-400 mb-6">Create your first calendar invite to get started</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gradient bg-gradient-to-r from-blue-400 to-purple-500 inline-block">Your Calendar Invites</h2>
                
                {receivedInvites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {receivedInvites.map(invite => (
                      <div 
                        key={invite.token_id} 
                        className={`p-4 bg-gray-800 border ${invite.is_redeemed ? 'border-green-700' : 'border-blue-700'} rounded-lg shadow-lg hover:shadow-blue-900/30 transition-all`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-white">Token #{invite.token_id}</h3>
                          <span className={`
                            px-2 py-1 text-xs rounded-full ${invite.is_redeemed 
                              ? 'bg-green-900 text-green-300 border border-green-700' 
                              : 'bg-yellow-900 text-yellow-300 border border-yellow-700'}
                          `}>
                            {invite.is_redeemed ? 'Redeemed' : 'Pending'}
                          </span>
                        </div>
                        
                        <p className="text-blue-300 mb-1"><span className="text-purple-300">Topic:</span> {invite.topic}</p>
                        <p className="text-blue-300 mb-1"><span className="text-purple-300">From:</span> {formatAddress(invite.sender_address)}</p>
                        <p className="text-blue-300 mb-3"><span className="text-purple-300">Duration:</span> {invite.duration} minutes</p>
                        
                        {invite.is_redeemed && invite.scheduled_time ? (
                          <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800 rounded">
                            <p className="text-sm text-blue-300"><span className="font-semibold">Scheduled for:</span> {formatDate(invite.scheduled_time)}</p>
                            
                            <button 
                              onClick={() => {
                                const event = {
                                  title: `Meeting: ${invite.topic}`,
                                  description: `Calendar invite from NFT #${invite.token_id}`,
                                  startTime: new Date(invite.scheduled_time),
                                  endTime: new Date(new Date(invite.scheduled_time).getTime() + invite.duration * 60000),
                                  location: 'Online Meeting'
                                };
                                
                                const startTime = event.startTime.toISOString().replace(/-|:|\.\d+/g, '');
                                const endTime = event.endTime.toISOString().replace(/-|:|\.\d+/g, '');
                                
                                const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
                                
                                window.open(calendarUrl, '_blank');
                              }}
                              className="mt-2 w-full py-1 px-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs rounded flex items-center justify-center hover:from-green-600 hover:to-blue-600 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Add to Calendar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedInvite(invite)}
                            className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-2 px-4 rounded transition-all transform hover:scale-105"
                          >
                            Schedule Meeting
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center items-center p-10">
                    <Link href="/" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-8 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 font-semibold text-lg">
                      Create New Invite
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
} 