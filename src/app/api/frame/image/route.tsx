import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'default';

  let title = 'NFT Calendar Invite';
  let description = 'Schedule meetings using web3 calendar invites';
  let buttonText = '';
  let bgColor = '#1e293b';
  
  // Configure visual elements based on type
  switch (type) {
    case 'send':
      title = 'Send Calendar Invite';
      description = 'Enter recipient wallet address';
      buttonText = 'Next';
      bgColor = '#3b82f6';
      break;
    case 'view':
      title = 'View Your Invites';
      description = 'Check and redeem calendar invites sent to you';
      buttonText = 'View My Invites';
      bgColor = '#10b981';
      break;
    case 'topic':
      title = 'Meeting Topic';
      description = 'What is this meeting about?';
      buttonText = 'Next';
      bgColor = '#3b82f6';
      break;
    case 'duration':
      title = 'Meeting Duration';
      description = 'How long should the meeting be?';
      buttonText = 'Choose Duration';
      bgColor = '#8b5cf6';
      break;
    case 'confirm':
      title = 'Confirm Invite';
      description = 'Ready to mint your calendar invite NFT?';
      buttonText = 'Mint Invite NFT';
      bgColor = '#ef4444';
      break;
    case 'success':
      title = 'Invite Created!';
      description = 'Your calendar invite NFT has been sent';
      buttonText = 'View Details';
      bgColor = '#10b981';
      break;
    default:
      title = 'NFT Calendar Invite';
      description = 'Schedule meetings using web3 calendar invites';
      buttonText = 'Get Started';
      bgColor = '#1e293b';
  }

  // Load fonts
  const interSemiBold = await fetch(
    new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZFhjQ.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  const interRegular = await fetch(
    new URL('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZFhjQ.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer());

  try {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: bgColor,
            padding: 50,
            color: 'white',
            fontFamily: 'Inter',
            position: 'relative',
          }}
        >
          {/* Calendar icon with NFT badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 30,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}
            >
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                style={{ opacity: 0.9 }}
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="white"
                  strokeWidth="2"
                />
                <line
                  x1="8"
                  y1="2"
                  x2="8"
                  y2="6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="16"
                  y1="2"
                  x2="16"
                  y2="6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="3"
                  y1="10"
                  x2="21"
                  y2="10"
                  stroke="white"
                  strokeWidth="2"
                />
                {type === 'send' && (
                  <circle cx="12" cy="16" r="3" fill="white" />
                )}
                {type === 'view' && (
                  <path
                    d="M8 14L11 17L16 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {type === 'success' && (
                  <path
                    d="M8 14L11 17L16 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {type === 'topic' && (
                  <text
                    x="12"
                    y="17"
                    textAnchor="middle"
                    fill="white"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    ABC
                  </text>
                )}
                {type === 'duration' && (
                  <text
                    x="12"
                    y="17"
                    textAnchor="middle"
                    fill="white"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    30m
                  </text>
                )}
              </svg>
            </div>
            
            {/* NFT badge */}
            <div
              style={{
                position: 'absolute',
                right: -10,
                top: -10,
                backgroundColor: '#ef4444',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>NFT</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <h1
              style={{
                fontSize: 50,
                fontWeight: 600,
                letterSpacing: -1,
                textAlign: 'center',
                margin: 0,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 24,
                opacity: 0.8,
                textAlign: 'center',
                margin: 0,
                marginBottom: 10,
              }}
            >
              {description}
            </p>
          </div>

          {buttonText && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '12px 30px',
                borderRadius: 50,
                marginTop: 40,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 500 }}>{buttonText}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'absolute',
              bottom: 30,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16, opacity: 0.8 }}>
              Powered by Farcaster & Base
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: interSemiBold,
            style: 'normal',
            weight: 600,
          },
          {
            name: 'Inter',
            data: interRegular,
            style: 'normal',
            weight: 400,
          },
        ],
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response('Error generating image', { status: 500 });
  }
} 