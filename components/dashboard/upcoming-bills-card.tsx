import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

type Bill = {
  id: string;
  name: string;
  amount: number;
  nextDueDate: Date;
  frequency: string;
  daysUntil: number;
};

type Props = {
  bills: Bill[];
  currency: string;
};

function DueBadge({ days }: { days: number }) {
  if (days <= 0)
    return (
      <Badge variant="outline" className="text-xs text-destructive border-destructive/40">
        Overdue
      </Badge>
    );
  if (days === 1)
    return (
      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">
        Tomorrow
      </Badge>
    );
  if (days <= 3)
    return (
      <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/40">
        in {days}d
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      in {days}d
    </Badge>
  );
}

export function UpcomingBillsCard({ bills, currency }: Props) {
  const total = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Upcoming Bills</CardTitle>
          <Link href="/transactions" className="text-xs text-primary hover:underline">
            Manage
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {bills.map((bill, i) => (
            <div key={bill.id}>
              {i > 0 && <Separator className="mb-3" />}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{bill.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-xs font-normal px-1.5 py-0">
                      {FREQ_LABELS[bill.frequency] ?? bill.frequency}
                    </Badge>
                    <DueBadge days={bill.daysUntil} />
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground shrink-0">
                  {formatCurrency(bill.amount, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Separator className="mt-3 mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total upcoming</span>
          <span className="font-semibold text-foreground">{formatCurrency(total, currency)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
