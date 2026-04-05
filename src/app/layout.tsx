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
  title: "BLDR | מועדון לאנשים שבונים בעידן האג׳נטי",
  description: "המועדון הראשון בישראל ללימודי תהליכים אג׳נטיים. עדכונים שבועיים, קהילה ומפגשים.",
  openGraph: {
    title: "BLDR | מועדון לאנשים שבונים בעידן האג׳נטי",
    description: "המועדון הראשון בישראל ללימודי תהליכים אג׳נטיים. עדכונים שבועיים, קהילה ומפגשים.",
    url: "https://app.bldr.co.il",
    siteName: "BLDR",
    images: [{ url: "https://app.bldr.co.il/logo.png", width: 500, height: 500, alt: "BLDR Logo" }],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BLDR | מועדון לאנשים שבונים בעידן האג׳נטי",
    description: "המועדון הראשון בישראל ללימודי תהליכים אג׳נטיים. עדכונים שבועיים, קהילה ומפגשים.",
    images: ["https://app.bldr.co.il/logo.png"],
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
      </body>
    </html>
  );
}
