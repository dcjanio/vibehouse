import { FrameContainer } from '@/components/frame/FrameContainer';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Calendar Invite NFTs
        </h1>
        
        <FrameContainer
          title="Mint Calendar Invite NFT"
          description="Create an NFT-based calendar invite that can be redeemed for a meeting"
          buttons={[
            {
              label: "Mint Invite",
              action: "mint"
            }
          ]}
        />
      </div>
    </main>
  );
}
