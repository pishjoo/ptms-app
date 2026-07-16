import { AlertCircle, ShieldAlert } from 'lucide-react';
import type { TradeCaseAlert } from '@/server/domain/trade-case/alerts/trade-case-alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AlertPanelProps {
  alerts: TradeCaseAlert[];
  risk: number;
}

export function AlertPanel({ alerts, risk }: AlertPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alerts</CardTitle>
          <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
            Risk {risk}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-500/15 p-2 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-100">{alert.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-100">No active alerts</p>
                <p className="mt-1 text-sm text-slate-400">The current case is progressing without blocking issues.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
