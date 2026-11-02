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
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    colors: {
                      slate: {
                        950: '#06090e',
                        900: '#0b0f17',
                        800: '#111827',
                        700: '#1f2937'
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[#0B0F17] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}