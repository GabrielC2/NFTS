import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MonkeyGen — NFT Variation Studio',
  description: 'Generate NFT variations powered by GPT-4o',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
