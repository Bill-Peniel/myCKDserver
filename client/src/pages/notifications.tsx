import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertTriangle, Bell, BellOff, Check, CheckCheck, ChevronLeft, ChevronRight, Info, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, PageHeader, SearchInput, SeverityBadge, UserAvatar } from '@/components/kit';
import { cn, formatDate, formatTime, getTimeAgo } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

/** Forme réelle renvoyée par /api/notifications (patient peuplé) */
interface NotificationItem {
  _id: string;
  message: string;
  severity?: 'error' | 'warning' | 'info' | 'dfg' | string;
  isRead: boolean;
  createdAt: string;
  patientId?: {
    _id?: string;
    ckdStage?: string;
    user?: { firstName?: string; lastName?: string };
  } | null;
}

type Filter = 'all' | 'unread' | 'critical' | 'dfg';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'critical', label: 'Critiques' },
  { value: 'dfg', label: 'DFG' },
];

const SEVERITY_ICON: Record<string, { icon: typeof Bell; cls: string }> = {
  error: { icon: AlertTriangle, cls: 'bg-destructive/10 text-destructive ring-destructive/20' },
  warning: { icon: AlertTriangle, cls: 'bg-warning/10 text-warning ring-warning/20' },
  info: { icon: Info, cls: 'bg-info/10 text-info ring-info/20' },
  dfg: { icon: Activity, cls: 'bg-chart-3/10 text-chart-3 ring-chart-3/20' },
};

function matchesFilter(n: NotificationItem, filter: Filter) {
  if (filter === 'unread') return !n.isRead;
  if (filter === 'critical') return n.severity === 'error';
  if (filter === 'dfg') return n.severity === 'dfg';
  return true;
}

/** « Patient X : message » → « message » (le patient est affiché à part) */
function cleanMessage(message: string, n: NotificationItem) {
  const u = n.patientId?.user;
  if (!u) return message;
  const prefix = `Patient ${u.firstName} ${u.lastName} : `;
  return message.startsWith(prefix) ? message.slice(prefix.length) : message;
}

function dayLabel(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  const label = d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function NotificationsSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  const { data, isLoading } = useQuery<{ notifications: NotificationItem[] }>({
    queryKey: ['/api/notifications'],
  });

  // Marquer une notification comme lue
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('POST', `/api/notifications/mark-read/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de marquer la notification comme lue',
        variant: 'destructive',
      });
    },
  });

  const handleMarkAsRead = (_id: string) => {
    if (!_id) {
      console.error('Notification _id is undefined');
      return;
    }
    markAsReadMutation.mutate(_id);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('POST', '/api/notifications/mark-all-read', {});
      await queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: 'Notifications lues',
        description: 'Toutes les notifications ont été marquées comme lues',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer toutes les notifications comme lues',
        variant: 'destructive',
      });
    }
  };

  const all = data?.notifications ?? [];
  const counts: Record<Filter, number> = {
    all: all.length,
    unread: all.filter((n) => !n.isRead).length,
    critical: all.filter((n) => n.severity === 'error').length,
    dfg: all.filter((n) => n.severity === 'dfg').length,
  };

  const filteredNotifications = all.filter((notification) => {
    const q = searchQuery.trim().toLowerCase();
    const patient = `${notification.patientId?.user?.firstName ?? ''} ${notification.patientId?.user?.lastName ?? ''}`.toLowerCase();
    const matchesSearch = q ? notification.message.toLowerCase().includes(q) || patient.includes(q) : true;
    return matchesSearch && matchesFilter(notification, filter);
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalPages = Math.max(1, Math.ceil(sortedNotifications.length / notificationsPerPage));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * notificationsPerPage;
  const paginatedNotifications = sortedNotifications.slice(startIndex, startIndex + notificationsPerPage);

  // Regroupement par jour
  const groups: { label: string; items: NotificationItem[] }[] = [];
  for (const n of paginatedNotifications) {
    const label = dayLabel(n.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }

  const hasUnreadNotifications = counts.unread > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={
          isLoading
            ? 'Alertes de laboratoire et suivi de vos patients'
            : hasUnreadNotifications
              ? `${counts.unread} non lue${counts.unread > 1 ? 's' : ''} sur ${counts.all} — alertes de laboratoire et suivi de vos patients`
              : 'Vous êtes à jour — alertes de laboratoire et suivi de vos patients'
        }
        actions={
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={!hasUnreadNotifications}>
            <CheckCheck /> Tout marquer comme lu
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 border-b p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 overflow-x-auto px-1">
            <div role="tablist" className="inline-flex h-9 items-center rounded-lg bg-muted/80 p-[3px] text-muted-foreground">
              {FILTERS.map((f) => {
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setFilter(f.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'inline-flex h-full items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground',
                    )}
                  >
                    {f.label}
                    <span
                      className={cn(
                        'tabular rounded px-1.5 py-px text-[11px] font-semibold leading-4',
                        active
                          ? f.value === 'critical'
                            ? 'bg-destructive/10 text-destructive'
                            : f.value === 'dfg'
                              ? 'bg-chart-3/10 text-chart-3'
                              : 'bg-primary/10 text-primary'
                          : 'bg-foreground/[0.06] text-muted-foreground',
                      )}
                    >
                      {isLoading ? '–' : counts[f.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <SearchInput
            placeholder="Rechercher un message ou un patient…"
            className="lg:w-72"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Liste */}
        {isLoading ? (
          <NotificationsSkeleton />
        ) : paginatedNotifications.length === 0 ? (
          searchQuery ? (
            <EmptyState
              icon={<SearchX />}
              title="Aucun résultat"
              description={`Aucune notification ne correspond à « ${searchQuery} ».`}
              action={<Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>Effacer la recherche</Button>}
            />
          ) : (
            <EmptyState
              icon={filter === 'unread' ? <CheckCheck /> : <BellOff />}
              title={filter === 'unread' ? 'Tout est lu' : 'Aucune notification'}
              description={filter === 'unread' ? 'Vous êtes à jour, aucune notification en attente.' : 'Les alertes concernant vos patients apparaîtront ici.'}
            />
          )
        ) : (
          <div>
            {groups.map((group) => (
              <section key={group.label}>
                <div className="sticky top-0 z-[1] flex items-center gap-2 border-b bg-muted/40 px-5 py-2 backdrop-blur">
                  <h3 className="text-xs font-medium text-muted-foreground">{group.label}</h3>
                  <span className="tabular text-[11px] text-muted-foreground/70">{group.items.length}</span>
                </div>
                <ul className="divide-y">
                  {group.items.map((notification) => {
                    const sev = SEVERITY_ICON[notification.severity ?? 'info'] ?? SEVERITY_ICON.info;
                    const Icon = sev.icon;
                    const user = notification.patientId?.user;
                    const unread = !notification.isRead;
                    return (
                      <li
                        key={notification._id}
                        className={cn(
                          'group relative flex items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5',
                          unread && 'bg-primary/[0.025]',
                        )}
                      >
                        {/* Pastille non-lu */}
                        <span
                          className={cn(
                            'absolute left-1.5 top-[33px] h-1.5 w-1.5 rounded-full sm:left-2',
                            unread ? 'bg-primary' : 'bg-transparent',
                          )}
                          aria-label={unread ? 'Non lue' : undefined}
                        />
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset', sev.cls)}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <p className={cn('text-sm leading-snug', unread ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                            {cleanMessage(notification.message, notification)}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <SeverityBadge severity={notification.severity} />
                            {user && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <UserAvatar firstName={user.firstName} lastName={user.lastName} size="xs" />
                                <span className="font-medium text-foreground/80">
                                  {user.firstName} {user.lastName}
                                </span>
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground sm:hidden">{getTimeAgo(notification.createdAt)}</span>
                          </div>
                        </div>

                        <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
                          <span
                            className="tabular whitespace-nowrap text-xs text-muted-foreground"
                            title={`${formatDate(notification.createdAt)} · ${formatTime(notification.createdAt)}`}
                          >
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {unread && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleMarkAsRead(notification._id)}
                              disabled={markAsReadMutation.isPending && markAsReadMutation.variables === notification._id}
                            >
                              <Check /> Marquer comme lu
                            </Button>
                          )}
                        </div>
                        {unread && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground sm:hidden"
                            onClick={() => handleMarkAsRead(notification._id)}
                            aria-label="Marquer comme lu"
                          >
                            <Check />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && sortedNotifications.length > notificationsPerPage && (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-5">
            <p className="tabular text-xs text-muted-foreground">
              {startIndex + 1}–{Math.min(startIndex + notificationsPerPage, sortedNotifications.length)} sur {sortedNotifications.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft />
              </Button>
              <span className="tabular px-2 text-xs font-medium text-muted-foreground">
                Page <span className="text-foreground">{page}</span> / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                aria-label="Page suivante"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
