import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex w-full h-full items-center justify-center pt-24">
      <SignIn routing="hash" />
    </div>
  );
}
