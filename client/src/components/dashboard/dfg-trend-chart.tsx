import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingDown, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit";
import { cn, formatShortDate } from "@/lib/utils";

const PERIODS = [
  { key: "1M", label: "1 mois", days: 30 },
  { key: "3M", label: "3 mois", days: 90 },
  { key: "6M", label: "6 mois", days: 182 },
  { key: "1A", label: "1 an", days: 365 },
  { key: "Tout", label: "Toute la période", days: Infinity },
] as const;

type Period = (typeof PERIODS)[number]["key"];

/** Évolution du DFG moyen (moyenne par jour des résultats « DFG ») */
export function DfgTrendChart({ labResults, className }: { labResults: any[]; className?: string }) {
  const [period, setPeriod] = useState<Period>("6M");

  const points = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)!.days;
    const since = days === Infinity ? 0 : Date.now() - days * 86400000;
    const byDay = new Map<string, number[]>();
    for (const r of labResults ?? []) {
      if (!r.labTest?.testName?.toLowerCase().includes("dfg")) continue;
      const t = new Date(r.resultDate).getTime();
      if (t < since) continue;
      const key = String(r.resultDate).slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), Number(r.resultValue)]);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, value: Math.round(values.reduce((sum: number, v: number) => sum + v, 0) / values.length) }));
  }, [labResults, period]);

  const last = points.at(-1)?.value;
  const first = points[0]?.value;
  const delta = last != null && first != null ? last - first : null;

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>Tendance du DFG moyen</CardTitle>
          <CardDescription>Débit de filtration glomérulaire (mL/min/1.73m²)</CardDescription>
        </div>
        <div className="flex shrink-0 rounded-lg bg-muted/80 p-[3px]" role="tablist" aria-label="Période">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                period === p.key ? "bg-background text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
              )}
              title={p.label}
            >
              {p.key}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {points.length === 0 ? (
          <EmptyState compact icon={<Activity />} title="Pas de DFG sur la période" description="Saisissez une créatinine sanguine : le DFG est calculé automatiquement." />
        ) : (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="tabular text-3xl font-semibold tracking-tight">{last}</span>
              <span className="text-sm text-muted-foreground">mL/min · dernière valeur</span>
              {delta != null && points.length > 1 && (
                <span
                  className={cn(
                    "ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                    delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                  )}
                >
                  {delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {delta > 0 ? "+" : ""}{delta} sur la période
                </span>
              )}
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dfgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    domain={[0, (max: number) => Math.max(100, Math.ceil(max / 10) * 10)]}
                  />
                  <ReferenceLine y={60} stroke="hsl(var(--warning))" strokeDasharray="4 4" strokeOpacity={0.7}
                    label={{ value: "Seuil 60", position: "insideTopRight", fill: "hsl(var(--warning))", fontSize: 10 }} />
                  <ReferenceLine y={15} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.6}
                    label={{ value: "Seuil 15", position: "insideTopRight", fill: "hsl(var(--destructive))", fontSize: 10 }} />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))" }}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-float">
                          <p className="text-muted-foreground">{formatShortDate(payload[0].payload.date)}</p>
                          <p className="tabular mt-0.5 font-medium">{payload[0].value} mL/min</p>
                        </div>
                      ) : null
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#dfgFill)"
                    dot={points.length < 25 ? { r: 3, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 } : false}
                    activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
