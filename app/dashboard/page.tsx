import { AlertTriangle, BadgeDollarSign, Landmark, PackageCheck, ScrollText, ShieldCheck, TrendingUp } from 'lucide-react';
import { AlertPanel } from '@/components/dashboard/alert-panel';
import { ProgressPanel } from '@/components/dashboard/progress-panel';
import { RecentActivityPanel } from '@/components/dashboard/recent-activity-panel';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeCaseAnalysisService } from '@/server/application/trade-case/trade-case-analysis-service';
import { MockTradeCaseProvider } from '@/server/mock/mock-trade-case-provider';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const provider = new MockTradeCaseProvider();
  const tradeCase = provider.getTradeCase();
  const analysisService = new TradeCaseAnalysisService();
  const analysis = analysisService.analyze(tradeCase);

  const timeline = [
    {
      title: 'Registration order approved',
      time: '09:15',
      description: 'The latest registration order was confirmed and forwarded to finance.',
    },
    {
      title: 'Currency allocation prepared',
      time: '08:40',
      description: 'An allocation request was prepared against the approved budget envelope.',
    },
    {
      title: 'Origin registration completed',
      time: '07:20',
      description: 'The item origin registration was accepted and matched to the customs record.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-brand-500">Phase 1</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Trade-case dashboard</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              Operational snapshot for {analysis.summary.companyName} with key financial and regulatory milestones.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
            <p className="text-sm text-slate-400">Case</p>
            <p className="text-lg font-semibold text-white">{analysis.summary.registrationNumber ?? 'Pending registration'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total CIF"
          value={currency.format(analysis.summary.approvedAllocation)}
          description="Approved allocation on the active trade case"
          icon={Landmark}
        />
        <SummaryCard
          title="Allocated Amount"
          value={currency.format(analysis.summary.commitmentCleared)}
          description="Amount already cleared for commitment"
          icon={BadgeDollarSign}
        />
        <SummaryCard
          title="Remaining Allocation"
          value={currency.format(analysis.summary.remainingAllocation)}
          description="Budget still pending against the allocation"
          icon={TrendingUp}
        />
        <SummaryCard
          title="Remaining Origin"
          value={currency.format(analysis.summary.remainingOrigin)}
          description="Origin registration still outstanding"
          icon={ShieldCheck}
        />
        <SummaryCard
          title="Remaining Declaration"
          value={currency.format(analysis.summary.remainingDeclaration)}
          description="Customs declaration balance pending"
          icon={ScrollText}
        />
        <SummaryCard
          title="Remaining Commitment"
          value={currency.format(analysis.summary.remainingCommitment)}
          description="Commitment settlement still open"
          icon={PackageCheck}
        />
        <SummaryCard
          title="Risk Score"
          value={`${analysis.risk}`}
          description="Calculated operational risk level"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <ProgressPanel progress={analysis.progress} status={analysis.summary.currentStatus} />
        <AlertPanel alerts={analysis.alerts} risk={analysis.risk} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentActivityPanel timeline={timeline} />
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Case Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-400">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-300">Assigned user</p>
              <p className="mt-1 font-medium text-slate-100">{analysis.summary.assignedUser ?? 'Unassigned'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-300">Last activity</p>
              <p className="mt-1 font-medium text-slate-100">
                {analysis.summary.lastActivity
                  ? new Date(analysis.summary.lastActivity).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'No activity recorded'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-300">Warnings</p>
              <p className="mt-1 font-medium text-slate-100">{analysis.summary.warningsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
