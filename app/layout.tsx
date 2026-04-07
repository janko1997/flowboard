import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FlowBoard',
  description: 'Real-time collaborative Kanban board',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The 'dark' class is toggled on <html> by AppShell based on uiSlice.darkMode.
    // The blocking script below runs synchronously before the first paint so the
    // correct class is already present when CSS is evaluated — no flash on refresh.
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('flowboard-dark-mode');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var dark = stored !== null ? stored === 'true' : prefersDark;
                if (dark) document.documentElement.classList.add('dark');
              } catch {}
            `,
          }}
        />
      </head>
      <body className="h-full" suppressHydrationWarning>{children}</body>
    </html>
  )
}
