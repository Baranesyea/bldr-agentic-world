import type { Metadata } from "next/types";
import { Merriweather } from "next/font/google";
import "./globals.css";
import { SeedLoader } from "@/components/seed-loader";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "BLDR | Agentic World",
  description: "Learning & Community Platform for the Agentic Era",
  manifest: "/manifest.json",
  themeColor: "#0000FF",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BLDR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body
        className={`${merriweather.variable} antialiased bg-background text-foreground`}
      >
        <SeedLoader />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js").catch(()=>{});}`,
          }}
        />
      </body>
    </html>
  );
}
