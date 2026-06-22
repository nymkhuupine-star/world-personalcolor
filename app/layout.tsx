import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.personalcolor.mn"),

  title: "Personal Color AI",

  description:
    "AI-д суурилсан хувийн өнгөний шинжилгээ — улирлын палитраа олж, илүү зөв сонголт хий.",

  icons: {
    icon: "/favicon-rounded.png",
    apple: "/favicon-rounded.png",
  },

  verification: {
    google: "x2DYp-Y7tupEzGcBgx5kGGTetGyzf_dv2BU68BXIRnI",
  },

  openGraph: {
    title: "Personal Color AI",
    description:
      "AI-д суурилсан хувийн өнгөний шинжилгээ — улирлын палитраа олж, илүү зөв сонголт хий.",
    images: [
      {
        url: "/personal%20(6).png",
        width: 1080,
        height: 1080,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Personal Color AI",
    description:
      "AI-д суурилсан хувийн өнгөний шинжилгээ — улирлын палитраа олж, илүү зөв сонголт хий.",
    images: ["/personal%20(6).png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="mn"
        className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      >
        <body
          suppressHydrationWarning
          className="min-h-full flex flex-col bg-white"
        >
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
