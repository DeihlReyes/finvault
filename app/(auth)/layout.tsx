export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary tracking-tight">FinVault</h1>
          <p className="text-muted-foreground text-sm mt-1">Gamified personal finance</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
