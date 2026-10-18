import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, CalendarClock, FlaskConical, Mail, MoreHorizontal, Pencil, Plus, Trash2, Workflow as WorkflowIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState, PageHeader, StageBadge } from '@/components/kit';
import { WorkflowModal } from '@/components/dashboard/workflow-modal';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface WorkflowRequirementItem {
  testName: string;
  frequency: string;
  alert: { type: string; value: string; unit: string };
  action: string;
}

interface WorkflowItem {
  _id: string;
  name: string;
  description?: string;
  ckdStage?: string;
  createdAt?: string;
  requirements?: WorkflowRequirementItem[];
}

function alertSymbol(type?: string) {
  if (type === 'Inférieur à') return '<';
  if (type === 'Supérieur à') return '>';
  return type ?? '';
}

function RequirementRow({ req }: { req: WorkflowRequirementItem }) {
  const isEmail = req.action === 'Email';
  return (
    <li className="flex flex-col gap-2 rounded-lg border bg-background/60 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-foreground">{req.testName || 'Test non défini'}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {req.frequency}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pl-[38px] sm:pl-0">
        <span
          className="tabular inline-flex items-center gap-1 rounded-md border border-warning/25 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"
          title={`Alerte si ${req.alert?.type?.toLowerCase()} ${req.alert?.value} ${req.alert?.unit}`}
        >
          <span className="font-semibold">{alertSymbol(req.alert?.type)}</span>
          {req.alert?.value || '—'}
          {req.alert?.unit && <span className="font-normal opacity-80">{req.alert.unit}</span>}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
            isEmail ? 'border-info/25 bg-info/10 text-info' : 'border-primary/25 bg-primary/10 text-primary',
          )}
        >
          {isEmail ? <Mail className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
          {req.action}
        </span>
      </div>
    </li>
  );
}

function WorkflowsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-start gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function WorkflowsPage() {
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);
  const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery<WorkflowItem[]>({
    queryKey: ['/api/workflows'],
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      await apiRequest('DELETE', `/api/workflows/${workflowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: 'Workflow supprimé',
        description: 'Le workflow a été supprimé avec succès',
      });
    },
    onError: (error) => {
      toast({
        title: 'Suppression impossible',
        description: error instanceof Error ? error.message : 'Veuillez réessayer',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setWorkflowModalOpen(true);
  };

  const handleEdit = (workflow: WorkflowItem) => {
    setSelectedWorkflow({ ...workflow });
    setWorkflowModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedWorkflow(null);
    setWorkflowModalOpen(false);
  };

  const list = workflows ?? [];
  const totalTests = list.reduce((acc, w) => acc + (w.requirements?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflows"
        description="Protocoles de suivi standardisés selon le stade de la maladie rénale."
        actions={
          <Button onClick={handleCreate}>
            <Plus /> Créer un workflow
          </Button>
        }
      />

      {isLoading ? (
        <WorkflowsSkeleton />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<WorkflowIcon />}
            title="Aucun workflow"
            description="Créez un protocole pour planifier automatiquement les analyses et les alertes de vos patients."
            action={
              <Button onClick={handleCreate}>
                <Plus /> Créer un workflow
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <p className="tabular text-xs text-muted-foreground">
            {list.length} protocole{list.length > 1 ? 's' : ''} · {totalTests} test{totalTests > 1 ? 's' : ''} surveillé{totalTests > 1 ? 's' : ''}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {list.map((workflow) => {
              const reqs = workflow.requirements ?? [];
              return (
                <Card key={workflow._id} className="group flex flex-col transition-all duration-200 hover:border-foreground/15 hover:shadow-float">
                  <div className="flex items-start gap-3 p-5 pb-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                      <WorkflowIcon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">{workflow.name}</h3>
                        <StageBadge stage={workflow.ckdStage} />
                      </div>
                      {workflow.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{workflow.description}</p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="-mr-1 -mt-1 shrink-0 text-muted-foreground" aria-label="Actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEdit(workflow)}>
                          <Pencil /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={() => setWorkflowToDelete(workflow)}
                        >
                          <Trash2 /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex-1 px-5">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Tests requis</h4>
                      <span className="tabular rounded bg-muted px-1.5 py-px text-[11px] font-semibold text-muted-foreground">{reqs.length}</span>
                    </div>
                    {reqs.length === 0 ? (
                      <p className="rounded-lg border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
                        Aucun test défini pour ce protocole.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {reqs.map((req, index) => (
                          <RequirementRow key={index} req={req} />
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t px-5 py-3">
                    <span className="text-xs text-muted-foreground">
                      {workflow.createdAt
                        ? `Créé le ${format(new Date(workflow.createdAt), 'd MMMM yyyy', { locale: fr })}`
                        : 'Protocole de suivi'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setWorkflowToDelete(workflow)}
                      >
                        <Trash2 /> <span className="hidden sm:inline">Supprimer</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                        <Pencil /> Modifier
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            <button
              type="button"
              onClick={handleCreate}
              className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-transparent p-6 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card shadow-card">
                <Plus className="h-5 w-5" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">Nouveau protocole</span>
                <span className="block text-xs">Définissez tests, fréquences et seuils d'alerte</span>
              </span>
            </button>
          </div>
        </>
      )}

      <AlertDialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce workflow ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le protocole « {workflowToDelete?.name} » sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => workflowToDelete && deleteWorkflowMutation.mutate(workflowToDelete._id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WorkflowModal isOpen={workflowModalOpen} onClose={handleCloseModal} workflow={selectedWorkflow} />
    </div>
  );
}
