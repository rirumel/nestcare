import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NestCare — Report a Home Issue',
  description: 'Submit maintenance requests to your property manager quickly and easily.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
