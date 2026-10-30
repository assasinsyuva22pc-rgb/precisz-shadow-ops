import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Precisz Shadow-Ops | Factory Intelligence",
  description: "Autonomous Factory Operations Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0B0F17] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}