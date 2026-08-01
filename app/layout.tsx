import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Navigation } from "@/components/common/nav";
import { Header } from "@/components/common/header";
import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SidIsha Budget",
  description: "Mobile-first, password-protected household finance and budget management app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifySession();

  let notifications: any[] = [];
  if (session) {
    notifications = await db
      .select()
      .from(schema.notificationLog)
      .where(eq(schema.notificationLog.userId, session.userId))
      .orderBy(desc(schema.notificationLog.sentAt))
      .limit(10);
  }

  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="SidIshaBudget" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {session ? (
            <>
              <Navigation userDisplayName={session.displayName} />
              <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
                <Header displayName={session.displayName} notifications={notifications} />
                <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
                  {children}
                </main>
              </div>
            </>
          ) : (
            <div className="flex-1 min-h-screen flex items-center justify-center p-4">
              {children}
            </div>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
