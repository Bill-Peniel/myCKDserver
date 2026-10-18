import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/kit";
import { getCKDStageLabel } from "@/lib/utils";

const STAGES = [
  { key: "Stage 1", color: "hsl(var(--stage-1))", hint: "DFG ≥ 90" },
  { key: "Stage 2", color: "hsl(var(--stage-2))", hint: "60 – 89" },
  { key: "Stage 3A", color: "hsl(var(--stage-3a))", hint: "45 – 59" },
  { key: "Stage 3B", color: "hsl(var(--stage-3b))", hint: "30 – 44" },
  { key: "Stage 4", color: "hsl(var(--stage-4))", hint: "15 – 29" },
  { key: "Stage 5", color: "hsl(var(--stage-5))", hint: "< 15" },
];

export function StageChart({ data, className }: { data: Record<string, number>; className?: string }) {
  const rows = STAGES.map((s) => ({ ...s, name: getCKDStageLabel(s.key), value: data?.[s.key] ?? 0 }));
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Répartition par stade MRC</CardTitle>
        <CardDescription>Classification KDIGO de vos patients</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState compact icon={<PieIcon />} title="Aucun patient classé" description="Les stades apparaîtront dès vos premiers patients." />
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rows.filter((r) => r.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="70%"
                    outerRadius="100%"
                    paddingAngle={3}
                    cornerRadius={4}
                    stroke="none"
                  >
                    {rows.filter((r) => r.value > 0).map((r) => (
                      <Cell key={r.key} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) =>
                      active && payload?.[0] ? (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-float">
                          <p className="font-medium">{payload[0].name}</p>
                          <p className="text-muted-foreground tabular">{payload[0].value} patient(s)</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="tabular text-3xl font-semibold tracking-tight">{total}</span>
                <span className="text-xs text-muted-foreground">patients</span>
              </div>
            </div>

            <ul className="w-full space-y-2.5">
              {rows.map((r) => {
                const pct = total ? Math.round((r.value / total) * 100) : 0;
                return (
                  <li key={r.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: r.color }} />
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.hint}</span>
                      </span>
                      <span className="tabular text-muted-foreground">
                        <span className="font-medium text-foreground">{r.value}</span> · {pct}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: r.color }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
