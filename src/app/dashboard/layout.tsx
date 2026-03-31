import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground" suppressHydrationWarning>
      <Sidebar />
      <main className="flex-1 ml-64 p-8 lg:p-12 relative overflow-y-auto" suppressHydrationWarning>
        {/* Background glow effects */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] pointer-events-none rounded-full" suppressHydrationWarning />
        <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/5 blur-[120px] pointer-events-none rounded-full" suppressHydrationWarning />
        
        <div className="relative z-10 max-w-[1600px] mx-auto" suppressHydrationWarning>
          {children}
        </div>
      </main>
    </div>
  );
}
