import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary tracking-tight">FinVault</h1>
          <p className="text-muted-foreground text-sm mt-1">Gamified personal finance</p>
        </div>
        <Card className="shadow-xl">
          <CardContent className="pt-8 pb-8 px-8">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
