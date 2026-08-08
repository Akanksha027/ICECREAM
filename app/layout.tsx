import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sundae & Co. — Small-batch ice cream & cookies",
  description:
    "Hand-churned ice cream and thick-baked cookies, made in small batches with real fruit and real butter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${jakarta.variable} ${caveat.variable} font-body bg-cream text-brown antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
