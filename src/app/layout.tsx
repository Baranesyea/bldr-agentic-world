import type { Metadata } from "next/types";
import { Merriweather } from "next/font/google";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "BLDR | Agentic World",
  description: "Learning & Community Platform for the Agentic Era",
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
        {children}
      </body>
    </html>
  );
}
