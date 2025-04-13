import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NFT Calendar Invite',
  description: 'Schedule meetings using NFT invites',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-gray-900 text-white">
        <div id="app" suppressHydrationWarning>
          {children}
        </div>
      </body>
    </html>
  )
}
