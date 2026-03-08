import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Narada",
  description: "Personal social auto-poster for LinkedIn and X"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}