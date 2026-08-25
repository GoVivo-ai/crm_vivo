import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <Image
        src="/brand/logo-vivo-blue.png"
        alt="VIVO"
        width={140}
        height={57}
        priority
      />
      <SignIn />
    </div>
  );
}
