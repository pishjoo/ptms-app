import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressPanelProps {
  progress: number;
  status: string;
}

export function ProgressPanel({ progress, status }: ProgressPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Overall completion</span>
            <span className="font-semibold text-slate-100">{progress}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-sm text-slate-400">Current workflow status</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{status}</p>
        </div>
      </CardContent>
    </Card>
  );
}
