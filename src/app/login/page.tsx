import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[180px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full" />
      
      <AuthForm />
    </div>
  );
}
