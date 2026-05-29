import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: { default: "GridWise", template: "%s | GridWise" },
  description: "AI-powered next-hour energy demand prediction for hospitals, data centers and MNCs. Built with Random Forest ML, FastAPI and Next.js.",
  keywords: ["energy prediction", "AI", "machine learning", "smart grid", "hospital energy", "data center energy"],
  authors: [{ name: "GridWise" }],
  openGraph: {
    title: "GridWise - AI Energy Prediction",
    description: "Predict next-hour energy demand for hospitals, data centers and MNCs using AI.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4a6741" />
      </head>
      <body className="bg-[#f1f4f1]">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}