import { Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentActivityPanelProps {
  timeline: Array<{
    title: string;
    time: string;
    description: string;
  }>;
}

export function RecentActivityPanel({ timeline }: RecentActivityPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                {index < timeline.length - 1 ? <div className="mt-2 h-full w-px bg-slate-800" /> : null}
              </div>
              <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-100">{item.title}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{item.time}</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
