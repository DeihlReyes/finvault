import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type BudgetItem = {
  id: string;
  categoryName: string;
  categoryEmoji: string;
  spent: number;
  monthlyLimit: number;
  percentage: number;
};

type Props = {
  budgets: BudgetItem[];
  currency: string;
};

export function BudgetHealthStrip({ budgets, currency }: Props) {
  if (budgets.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Budget Health</CardTitle>
          <Link href="/budgets" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const barColor =
              budget.percentage > 100
                ? "bg-destructive"
                : budget.percentage >= 80
                  ? "bg-amber-500"
                  : "bg-primary";

            const labelColor =
              budget.percentage > 100
                ? "text-destructive"
                : budget.percentage >= 80
                  ? "text-amber-500"
                  : "text-muted-foreground";

            return (
              <div key={budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {budget.categoryEmoji} {budget.categoryName}
                  </span>
                  <span className={`font-semibold ${labelColor}`}>
                    {Math.round(budget.percentage)}%
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, budget.percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(budget.spent, currency)}</span>
                  <span>{formatCurrency(budget.monthlyLimit, currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
