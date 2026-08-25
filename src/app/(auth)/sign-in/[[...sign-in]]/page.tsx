import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import { BrandBackdrop } from "@/shared/ui/brand-backdrop";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-[#011640]">
      <BrandBackdrop />
      <div className="relative flex flex-col items-center gap-8">
        <Image
          src="/brand/logo-vivo-white.png"
          alt="VIVO"
          width={150}
          height={61}
          priority
        />
        <SignIn />
      </div>
    </div>
  );
}
