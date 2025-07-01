
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{workflow ? 'Modifier le Workflow' : 'Créer un Workflow'}</DialogTitle>
          <DialogDescription>
            {workflow ? 'Modifiez les paramètres du workflow existant.' : 'Créez un protocole de suivi standardisé pour les patients selon leur stade d\'IRC.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor="workflow-name">Nom du Workflow</Label>
              <Input
                id="workflow-name"
                className="mt-1"
                placeholder="Suivi Stage 3 IRC"
                value={workflowData.name}
                onChange={(e) => setWorkflowData({ ...workflowData, name: e.target.value })}
              />
            </div>

            <div className="sm:col-span-3">
              <Label htmlFor="workflow-type">Stade IRC</Label>
              <Select 
                value={workflowData.type}
                onValueChange={(value) => setWorkflowData({ ...workflowData, type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner le stade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stage 1">Stage 1</SelectItem>
                  <SelectItem value="Stage 2">Stage 2</SelectItem>
                  <SelectItem value="Stage 3A">Stage 3A</SelectItem>
                  <SelectItem value="Stage 3B">Stage 3B</SelectItem>
                  <SelectItem value="Stage 4">Stage 4</SelectItem>
                  <SelectItem value="Stage 5">Stage 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-6">
              <Label htmlFor="workflow-description">Description</Label>
              <Textarea 
                id="workflow-description" 
                className="mt-1"
                rows={3}
                placeholder="Protocole de suivi pour les patients avec fonction rénale modérément diminuée"
                value={workflowData.description}
                onChange={(e) => setWorkflowData({ ...workflowData, description: e.target.value })}
              />
            </div>

            <div className="sm:col-span-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Tests et Seuils</h3>
                <Button onClick={addNewRequirement} variant="outline" size="sm">
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter un Test
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Fréquence</TableHead>
                    <TableHead>Seuil d'Alerte</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflowData.requirements.map((req, index) => (
                    <TableRow key={index}>
                      <TableCell>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un test" />
                          </SelectTrigger>
                          <SelectContent>
                            {labTests?.map((test) => (
                              <SelectItem 
                                key={test._id} 
                                value={test.testName}
                                className="flex flex-col items-start py-3"
                              >
                                <div className="font-medium">{test.testName}</div>
                                {test.description && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {test.description}
                                  </div>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={req.frequency}
                          onValueChange={(value) => {
                            const updated = [...workflowData.requirements];
                            updated[index].frequency = value;
                            setWorkflowData({ ...workflowData, requirements: updated });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tous les mois">Tous les mois</SelectItem>
                            <SelectItem value="Tous les 3 mois">Tous les 3 mois</SelectItem>
                            <SelectItem value="Tous les 6 mois">Tous les 6 mois</SelectItem>
                            <SelectItem value="Tous les ans">Tous les ans</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={req.alert.type}
                            onValueChange={(value) => {
                              const updated = [...workflowData.requirements];
                              updated[index].alert.type = value;
                              setWorkflowData({ ...workflowData, requirements: updated });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inférieur à">Inférieur à</SelectItem>
                              <SelectItem value="Supérieur à">Supérieur à</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            className="w-24"
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
                          />
                          <Input
                            className="w-24"
                            value={req.alert.unit}
                            readOnly
                            disabled
                            placeholder="Unité"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
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
                            <SelectItem value="Email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRequirement(index)}
                          disabled={workflowData.requirements.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSaveWorkflow}
            disabled={saveWorkflowMutation.isPending}
          >
            {saveWorkflowMutation.isPending ? 'Enregistrement...' : (workflow ? 'Modifier' : 'Créer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
