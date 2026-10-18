import { Link } from "wouter";
import { ArrowRight, Bell, CalendarDays, FlaskConical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, RangeBadge, SeverityBadge, StatusBadge, UserAvatar } from "@/components/kit";
import { cn, formatShortDate, formatTime, getTimeAgo } from "@/lib/utils";

function ListCard({ title, description, href, children }: { title: string; description: string; href: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="-mr-2 text-muted-foreground">
          <Link href={href}>
            Tout voir <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 px-2 pb-2">{children}</CardContent>
    </Card>
  );
}

export function RecentLabResults({ labResults }: { labResults: any[] }) {
  const recent = [...(labResults ?? [])]
    .sort((a, b) => new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime())
    .slice(0, 5);

  return (
    <ListCard title="Derniers résultats" description="Analyses les plus récentes" href="/lab-results">
      {recent.length === 0 ? (
        <EmptyState compact icon={<FlaskConical />} title="Aucun résultat" description="Les analyses saisies apparaîtront ici." />
      ) : (
        <ul className="space-y-0.5">
          {recent.map((r) => (
            <li key={r._id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60">
              <UserAvatar firstName={r.patient?.user?.firstName} lastName={r.patient?.user?.lastName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{r.labTest?.testName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.patient?.user?.firstName} {r.patient?.user?.lastName} · {formatShortDate(r.resultDate)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="tabular text-[13px] font-semibold">
                  {r.resultValue} <span className="text-xs font-normal text-muted-foreground">{r.labTest?.unit}</span>
                </span>
                <RangeBadge value={Number(r.resultValue)} min={r.labTest?.normalMin} max={r.labTest?.normalMax} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  );
}

export function RecentAlerts({ notifications }: { notifications: any[] }) {
  const items = (notifications ?? []).slice(0, 5);
  return (
    <ListCard title="Alertes récentes" description="Notifications liées à vos patients" href="/notifications">
      {items.length === 0 ? (
        <EmptyState compact icon={<Bell />} title="Aucune alerte" description="Tout est calme pour le moment." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((n) => (
            <li key={n._id} className="flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.isRead ? "bg-border" : "bg-primary")} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className={cn("line-clamp-2 text-[13px] leading-snug", n.isRead ? "text-muted-foreground" : "font-medium text-foreground")}>
                  {n.message}
                </p>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={n.severity} />
                  <span className="text-xs text-muted-foreground">{getTimeAgo(n.createdAt)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ListCard>
  );
}

export function UpcomingAppointments({ appointments }: { appointments: any[] }) {
  const items = (appointments ?? []).slice(0, 5);
  return (
    <ListCard title="Prochains rendez-vous" description="Consultations planifiées" href="/appointments">
      {items.length === 0 ? (
        <EmptyState compact icon={<CalendarDays />} title="Aucun rendez-vous à venir" description="Planifiez une consultation depuis l'agenda." />
      ) : (
        <ul className="space-y-0.5">
          {items.map((a) => {
            const d = new Date(a.appointmentDate);
            return (
              <li key={a._id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60">
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border bg-background py-1 shadow-xs">
                  <span className="text-[10px] font-medium uppercase text-primary">
                    {d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")}
                  </span>
                  <span className="tabular text-base font-semibold leading-none">{d.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {a.patient?.user?.firstName} {a.patient?.user?.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatTime(a.appointmentDate)} · {a.purpose || "Consultation"}
                  </p>
                </div>
                <StatusBadge status={a.doctorStatus} />
              </li>
            );
          })}
        </ul>
      )}
    </ListCard>
  );
}
