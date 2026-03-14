import "./globals.css";

// ═══════════════════════════════════════════════════════════════
// ROOT LAYOUT — LLM GATEWAY
// ═══════════════════════════════════════════════════════════════
export const metadata = {
  title: "LLM Gateway — Unified AI Access Control",
  description: "A cyberpunk-themed admin dashboard for managing LLM provider access, API keys, and model permissions.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
