import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper to get host from request or default
function getHost() {
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  const host = getHost();
  
  try {
    const data = await req.json();
    const { untrustedData } = data;
    
    // Extract relevant data
    const { buttonIndex, inputText, state } = untrustedData;
    
    // Parse state if available
    let currentState = {};
    try {
      if (state) {
        currentState = JSON.parse(decodeURIComponent(state));
      }
    } catch (error) {
      console.error('Error parsing state:', error);
    }
    
    // Current step in the flow (default: initial)
    const currentStep = (currentState as any).step || 'initial';
    
    // Handle different states
    switch (currentStep) {
      case 'initial':
        if (buttonIndex === 1) {
          // Send Invite flow
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=send`,
              input: {
                text: 'Enter recipient wallet address',
                placeholder: '0x...'
              },
              buttons: [
                { label: 'Next', action: 'post' },
                { label: 'Cancel', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'recipient',
              })),
              postUrl: `${host}/api/frame/action`
            }
          });
        } else if (buttonIndex === 2) {
          // View Invites flow
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=view`,
              buttons: [
                { label: 'View My Invites', action: 'post_redirect' },
                { label: 'Back', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'viewInvites',
              })),
              postUrl: `${host}/api/frame/action`,
              postRedirectUrl: `${host}/invites`
            }
          });
        }
        break;
        
      case 'recipient':
        // User entered recipient address
        if (buttonIndex === 1 && inputText) {
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=topic`,
              input: {
                text: 'Enter meeting topic',
                placeholder: 'Project Discussion'
              },
              buttons: [
                { label: 'Next', action: 'post' },
                { label: 'Back', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'topic',
                recipient: inputText
              })),
              postUrl: `${host}/api/frame/action`
            }
          });
        } else if (buttonIndex === 2 || !inputText) {
          // Cancel or empty input, go back to initial
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=default`,
              buttons: [
                { label: 'Send Invite', action: 'post' },
                { label: 'Book Meeting', action: 'post' }
              ],
              postUrl: `${host}/api/frame/action`
            }
          });
        }
        break;
        
      case 'topic':
        // User entered meeting topic
        if (buttonIndex === 1 && inputText) {
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=duration`,
              buttons: [
                { label: '30 minutes', action: 'post' },
                { label: '60 minutes', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'duration',
                recipient: (currentState as any).recipient,
                topic: inputText
              })),
              postUrl: `${host}/api/frame/action`
            }
          });
        } else if (buttonIndex === 2) {
          // Go back to recipient step
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=send`,
              input: {
                text: 'Enter recipient wallet address',
                placeholder: '0x...'
              },
              buttons: [
                { label: 'Next', action: 'post' },
                { label: 'Cancel', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'recipient',
              })),
              postUrl: `${host}/api/frame/action`
            }
          });
        }
        break;
        
      case 'duration':
        // Duration selection (30 or 60 minutes)
        const duration = buttonIndex === 1 ? 30 : 60;
        
        if (buttonIndex === 1 || buttonIndex === 2) {
          // Go to confirmation
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=confirm`,
              buttons: [
                { label: 'Mint Invite NFT', action: 'post_redirect' },
                { label: 'Cancel', action: 'post' }
              ],
              state: encodeURIComponent(JSON.stringify({
                step: 'confirm',
                recipient: (currentState as any).recipient,
                topic: (currentState as any).topic,
                duration: duration
              })),
              postUrl: `${host}/api/frame/action`,
              postRedirectUrl: `${host}/?recipient=${encodeURIComponent((currentState as any).recipient)}&topic=${encodeURIComponent((currentState as any).topic)}&duration=${duration}`
            }
          });
        }
        break;
        
      case 'confirm':
        if (buttonIndex === 2) {
          // Cancel and go back to initial
          return NextResponse.json({
            type: 'frame',
            frame: {
              image: `${host}/api/frame/image?type=default`,
              buttons: [
                { label: 'Send Invite', action: 'post' },
                { label: 'Book Meeting', action: 'post' }
              ],
              postUrl: `${host}/api/frame/action`
            }
          });
        }
        break;
        
      case 'viewInvites':
        // Return to initial
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${host}/api/frame/image?type=default`,
            buttons: [
              { label: 'Send Invite', action: 'post' },
              { label: 'Book Meeting', action: 'post' }
            ],
            postUrl: `${host}/api/frame/action`
          }
        });
        
      default:
        // Default to initial frame
        return NextResponse.json({
          type: 'frame',
          frame: {
            image: `${host}/api/frame/image?type=default`,
            buttons: [
              { label: 'Send Invite', action: 'post' },
              { label: 'Book Meeting', action: 'post' }
            ],
            postUrl: `${host}/api/frame/action`
          }
        });
    }
    
    // Default fallback response
    return NextResponse.json({
      type: 'frame',
      frame: {
        image: `${host}/api/frame/image?type=default`,
        buttons: [
          { label: 'Send Invite', action: 'post' },
          { label: 'Book Meeting', action: 'post' }
        ],
        postUrl: `${host}/api/frame/action`
      }
    });
  } catch (error) {
    console.error('Error handling frame action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 