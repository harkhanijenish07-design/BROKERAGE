import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex w-full h-full items-center justify-center pt-24">
      <SignUp routing="hash" />
    </div>
  );
}
