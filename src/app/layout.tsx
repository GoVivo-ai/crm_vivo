import { ClerkProvider } from "@clerk/nextjs";
import { vivoLocalization } from "@/shared/ui/clerk-localization";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Tipografías oficiales de la marca VIVO: Nunito (display) + Nunito Sans
// (texto). El brand book no define mono; IBM Plex Mono queda como utilidad
// para cifras por sus numerales tabulares.
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ERP VIVO",
  description: "ERP 360 de govivo.ai",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={vivoLocalization}>
      <html
        lang="es"
        className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
