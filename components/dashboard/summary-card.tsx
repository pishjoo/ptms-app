import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export function SummaryCard({ title, value, description, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        <div className="rounded-full bg-slate-800 p-2 text-slate-200">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}
