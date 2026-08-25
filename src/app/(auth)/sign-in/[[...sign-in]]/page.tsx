import { SignIn } from "@clerk/nextjs";
import { Check } from "lucide-react";
import Image from "next/image";

const BULLETS = [
  "Caja, cartera y rentabilidad por cliente en tiempo real",
  "Sincronizado con QuickBooks, Meta Ads y ClickUp",
  "Cada rol ve exactamente lo suyo",
];

/** Sign-in del artboard SignIn.dc.html: panel de marca navy + widget de
 * Clerk vestido con appearance (localización es en el ClerkProvider). */
export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden shrink-0 flex-col overflow-hidden bg-[#011640] p-14 text-white lg:flex lg:w-[44%]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#04D98B] to-[#F2E205]" />
        <Image
          src="/brand/logomark-white.png"
          alt=""
          aria-hidden
          width={560}
          height={412}
          className="pointer-events-none absolute -right-36 -bottom-30 -rotate-12 opacity-[0.07] select-none"
        />
        <Image
          src="/brand/logo-vivo-white.png"
          alt="VIVO"
          width={112}
          height={46}
          priority
          className="self-start"
        />
        <div className="relative mt-auto">
          <h1 className="max-w-md font-[family-name:var(--font-display)] text-[40px] leading-[1.15] font-extrabold tracking-[-0.01em]">
            Toda la agencia,
            <br />
            en una sola pantalla.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed font-semibold text-white/70">
            Comercial, clientes, dinero y equipo — conectados y al día, sin
            abrir cinco herramientas.
          </p>
          <ul className="mt-9 flex flex-col gap-3">
            {BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-center gap-3 text-[13.5px] font-bold"
              >
                <span className="grid size-[26px] shrink-0 place-items-center rounded-lg bg-[#04D98B]/15">
                  <Check className="size-3.5 text-[#04D98B]" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#F6F7F9] p-6">
        <Image
          src="/brand/logo-vivo-white.png"
          alt="VIVO"
          width={100}
          height={41}
          className="rounded-xl bg-[#011640] p-2.5 lg:hidden"
        />
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#04D98B",
              colorForeground: "#0A1E3F",
              colorMutedForeground: "#5A6B85",
              borderRadius: "10px",
            },
            elements: {
              cardBox: "rounded-[18px] shadow-[0_12px_40px_-18px_rgba(1,22,64,0.18)] border border-[#E3E8F0]",
              headerTitle:
                "font-[family-name:var(--font-display)] text-[23px] font-extrabold text-[#011640]",
              formButtonPrimary:
                "rounded-full bg-[#04D98B] text-[#011640] font-extrabold shadow-none hover:bg-[#03C47D]",
              socialButtonsBlockButton: "rounded-full font-extrabold",
              formFieldInput: "rounded-[10px]",
            },
          }}
        />
        <p className="text-xs font-semibold text-[#8B99B0]">
          Acceso solo por invitación · pídesela a tu admin
        </p>
      </div>
    </div>
  );
}
