import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "St Joseph Catholic Church – Administration",
  description: "Parish management system for St Joseph Catholic Church – members, attendance, finance, and more",
  icons: {
    icon: [
      { url: "/images/logos/logo.png", type: "image/png" },
    ],
    shortcut: "/images/logos/logo.png",
    apple: "/images/logos/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
