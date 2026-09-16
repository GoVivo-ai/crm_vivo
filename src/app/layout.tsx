import { ClerkProvider } from "@clerk/nextjs";
import { vivoLocalization } from "@/shared/ui/clerk-localization";
import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Tipografías oficiales de la marca VIVO y las únicas dos que carga el ERP:
// Nunito (display) + Nunito Sans (texto). El design system no define una mono,
// así que no hay ninguna: las cifras usan los numerales tabulares de Nunito Sans
// (`tabular-nums`), como pide el §15.2.
const display = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const sans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  // 800 incluido: el §3 pide el dato protagonista de tablas en extrabold y sin
  // este peso el navegador lo redondeaba a 700 o lo sintetizaba.
  weight: ["400", "600", "700", "800"],
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
        className={`${display.variable} ${sans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
