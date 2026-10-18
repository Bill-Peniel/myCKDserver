
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, CalendarClock, FlaskConical, Gauge, Plus, Trash2, Workflow as WorkflowIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LabTest {
  _id: string;
  testName: string;
  unit?: string;
  description?: string;
}

const fieldLabel = 'flex items-center gap-1 text-xs font-medium text-muted-foreground';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow?: any;
}

export function WorkflowModal({ isOpen, onClose, workflow }: WorkflowModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: labTests } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests'],
  });

  const [workflowData, setWorkflowData] = useState<{
    name: string;
    type: string;
    description: string;
    requirements: {
      testName: string;
      frequency: string;
      alert: {
        type: string;
        value: string;
        unit: string;
      };
      action: string;
    }[];
  }>({
    name: '',
    type: 'Stage 3A',
    description: '',
    requirements: [
      {
        testName: '',
        frequency: 'Tous les 3 mois',
        alert: {
          type: 'Inférieur à',
          value: '',
          unit: ''
        },
        action: 'Notification'
      }
    ]
  });

  useEffect(() => {
    if (workflow) {
      setWorkflowData({
        name: workflow.name || '',
        type: workflow.ckdStage || 'Stage 3A',
        description: workflow.description || '',
        requirements: (workflow.requirements || []).map((req: any) => ({
          testName: req.testName || '',
          frequency: req.frequency || 'Tous les 3 mois',
          alert: {
            type: req.alert?.type || 'Inférieur à',
            value: req.alert?.value || '',
            unit: req.alert?.unit || ''
          },
          action: req.action || 'Notification'
        }))
      });
    } else {
      resetForm();
    }
  }, [workflow]);
  
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = workflow ? 'PUT' : 'POST';
      const url = workflow ? `/api/workflows/${workflow._id}` : '/api/workflows';
      
      return await apiRequest(method, url, {
        name: data.name,
        description: data.description,
        ckdStage: data.type,
        requirements: data.requirements.map((req: any) => ({
          testName: req.testName,
          frequency: req.frequency,
          alert: {
            type: req.alert.type,
            value: req.alert.value,
            unit: req.alert.unit
          },
          action: req.action
        }))
      });
    },
    onSuccess: () => {
      toast({
        title: workflow ? 'Workflow modifié' : 'Workflow créé',
        description: workflow ? 'Le workflow a été modifié avec succès' : 'Le workflow a été créé avec succès',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  });

  const handleSaveWorkflow = () => {
    if (!workflowData.name.trim()) {
      toast({
        title: 'Champ requis manquant',
        description: 'Veuillez donner un nom au workflow',
        variant: 'destructive',
      });
      return;
    }
    
    saveWorkflowMutation.mutate(workflowData);
  };

  const resetForm = () => {
    setWorkflowData({
      name: '',
      type: 'Stage 3A',
      description: '',
      requirements: [
        {
          testName: '',
          frequency: 'Tous les 3 mois',
          alert: {
            type: 'Inférieur à',
            value: '',
            unit: ''
          },
          action: 'Notification'
        }
      ]
    });
  };

  const addNewRequirement = () => {
    setWorkflowData({
      ...workflowData,
      requirements: [
        ...workflowData.requirements,
        {
          testName: '',
          frequency: 'Tous les 3 mois',
          alert: {
            type: 'Inférieur à',
            value: '',
            unit: ''
          },
          action: 'Notification'
        }
      ]
    });
  };

  const removeRequirement = (index: number) => {
    const updatedRequirements = [...workflowData.requirements];
    updatedRequirements.splice(index, 1);
    setWorkflowData({
      ...workflowData,
      requirements: updatedRequirements
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 text-left">
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <WorkflowIcon className="h-[18px] w-[18px]" />
            </div>
            <div className="space-y-1">
              <DialogTitle>{workflow ? 'Modifier le workflow' : 'Créer un workflow'}</DialogTitle>
              <DialogDescription>
                {workflow ? 'Modifiez les paramètres du protocole existant.' : 'Créez un protocole de suivi standardisé pour les patients selon leur stade de MRC.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Informations générales */}
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="workflow-name" className="text-[13px]">Nom du workflow</Label>
                <Input
                  id="workflow-name"
                  placeholder="Suivi stade 3 MRC"
                  value={workflowData.name}
                  onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="workflow-type" className="text-[13px]">Stade MRC</Label>
                <Select
                  value={workflowData.type}
                  onValueChange={(value) => setWorkflowData({ ...workflowData, type: value })}
                >
                  <SelectTrigger id="workflow-type">
                    <SelectValue placeholder="Sélectionner le stade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stage 1">Stade 1</SelectItem>
                    <SelectItem value="Stage 2">Stade 2</SelectItem>
                    <SelectItem value="Stage 3A">Stade 3A</SelectItem>
                    <SelectItem value="Stage 3B">Stade 3B</SelectItem>
                    <SelectItem value="Stage 4">Stade 4</SelectItem>
                    <SelectItem value="Stage 5">Stade 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="workflow-description" className="text-[13px]">Description</Label>
              <Textarea
                id="workflow-description"
                rows={2}
                className="min-h-[64px] resize-none"
                placeholder="Protocole de suivi pour les patients avec fonction rénale modérément diminuée"
                value={workflowData.description}
                onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
              />
            </div>
          </section>

          {/* Exigences */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[15px] font-semibold">
                  Tests et seuils
                  <span className="tabular rounded bg-muted px-1.5 py-px text-[11px] font-semibold text-muted-foreground">
                    {workflowData.requirements.length}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">Analyses à réaliser et conditions de déclenchement d'une alerte.</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {workflowData.requirements.map((req, index) => (
                <li key={index} className="rounded-xl border bg-muted/30 p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-background text-[11px] font-semibold text-foreground ring-1 ring-inset ring-border">
                        {index + 1}
                      </span>
                      <span className="truncate">{req.testName || 'Nouveau test'}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      type="button"
                      className="-mr-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeRequirement(index)}
                      disabled={workflowData.requirements.length === 1}
                      aria-label="Retirer ce test"
                      title="Retirer ce test"
                    >
                      <Trash2 />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-12">
                    <div className="space-y-1.5 sm:col-span-7">
                      <span className={fieldLabel}>
                        <FlaskConical className="h-3 w-3" />
                        Analyse
                      </span>
                      <Select
                        value={req.testName}
                        onValueChange={(value) => {
                          const updated = [...workflowData.requirements];
                          const selectedTest = labTests?.find(test => test.testName === value);
                          updated[index] = {
                            ...updated[index],
                            testName: value,
                            alert: {
                              ...updated[index].alert,
                              unit: selectedTest?.unit || ''
                            }
                          };
                          setWorkflowData({ ...workflowData, requirements: updated });
                        }}
                      >
                        <SelectTrigger className="[&_[data-desc]]:hidden">
                          <SelectValue placeholder="Sélectionner un test" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {labTests?.map((test) => (
                            <SelectItem
                              key={test._id}
                              value={test.testName}
                              className="py-2"
                            >
                              <span className="font-medium">{test.testName}</span>
                              {test.description && (
                                <span data-desc className="mt-0.5 block text-xs text-muted-foreground">
                                  {test.description}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-5">
                      <span className={fieldLabel}>
                        <CalendarClock className="h-3 w-3" />
                        Fréquence
                      </span>
                      <Select
                        value={req.frequency}
                        onValueChange={(value) => {
                          const updated = [...workflowData.requirements];
                          updated[index].frequency = value;
                          setWorkflowData({ ...workflowData, requirements: updated });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tous les mois">Tous les mois</SelectItem>
                          <SelectItem value="Tous les 3 mois">Tous les 3 mois</SelectItem>
                          <SelectItem value="Tous les 6 mois">Tous les 6 mois</SelectItem>
                          <SelectItem value="Tous les ans">Tous les ans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-7">
                      <span className={fieldLabel}>
                        <Gauge className="h-3 w-3" />
                        Seuil d'alerte
                      </span>
                      <div className="flex gap-2">
                        <Select
                          value={req.alert.type}
                          onValueChange={(value) => {
                            const updated = [...workflowData.requirements];
                            updated[index].alert.type = value;
                            setWorkflowData({ ...workflowData, requirements: updated });
                          }}
                        >
                          <SelectTrigger className="w-[132px] shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inférieur à">Inférieur à</SelectItem>
                            <SelectItem value="Supérieur à">Supérieur à</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="relative min-w-0 flex-1">
                          <Input
                            className="tabular pr-[72px]"
                            type="number"
                            step="0.01"
                            value={req.alert.value}
                            onChange={(e) => {
                              const value = e.target.value.replace(',', '.');
                              if (!isNaN(parseFloat(value)) || value === '') {
                                const updated = [...workflowData.requirements];
                                updated[index].alert.value = value;
                                setWorkflowData({ ...workflowData, requirements: updated });
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value && !isNaN(parseFloat(value))) {
                                const updated = [...workflowData.requirements];
                                updated[index].alert.value = parseFloat(value).toString();
                                setWorkflowData({ ...workflowData, requirements: updated });
                              }
                            }}
                            placeholder="Valeur"
                            aria-label="Valeur du seuil"
                          />
                          <span
                            className="pointer-events-none absolute inset-y-1 right-1 flex max-w-[68px] items-center rounded-md bg-muted px-2 text-xs text-muted-foreground"
                            title="Unité (définie par l'analyse)"
                          >
                            <span className="truncate">{req.alert.unit || 'Unité'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:col-span-5">
                      <span className={fieldLabel}>
                        <Bell className="h-3 w-3" />
                        Action
                      </span>
                      <Select
                        value={req.action}
                        onValueChange={(value) => {
                          const updated = [...workflowData.requirements];
                          updated[index].action = value;
                          setWorkflowData({ ...workflowData, requirements: updated });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Notification">Notification</SelectItem>
                          <SelectItem value="Email">E-mail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addNewRequirement}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.03] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" /> Ajouter un test
            </button>
          </section>
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/30 px-6 py-4 sm:space-x-0">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSaveWorkflow}
            disabled={saveWorkflowMutation.isPending}
          >
            {saveWorkflowMutation.isPending ? 'Enregistrement…' : (workflow ? 'Enregistrer' : 'Créer le workflow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
