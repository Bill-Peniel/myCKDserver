
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getCKDStageColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader } from '@/components/ui/loader';
import { Badge } from '@/components/ui/badge';
import { WorkflowModal } from '@/components/dashboard/workflow-modal';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function WorkflowsPage() {
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/workflows'],
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Échec de la suppression du workflow');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: 'Workflow supprimé',
        description: 'Le workflow a été supprimé avec succès',
      });
    },
  });

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setWorkflowModalOpen(true);
  };

  const handleEdit = (workflow) => {
    setSelectedWorkflow({...workflow});
    setWorkflowModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedWorkflow(null);
    setWorkflowModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
        <div className="h-96 flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workflows</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos protocoles de suivi standardisés pour les patients
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="flex items-center space-x-2"
        >
          <span>Créer un Workflow</span>
        </Button>
      </div>

      <div className="grid gap-6">
        {workflows?.map((workflow) => (
          <Card key={workflow._id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getCKDStageColor(workflow.ckdStage).bg} ${getCKDStageColor(workflow.ckdStage).text}`}
                >
                  {workflow.ckdStage}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Tests Requis ({workflow.requirements?.length || 0})</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Test</TableHead>
                          <TableHead>Fréquence</TableHead>
                          <TableHead>Seuil d'Alerte</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workflow.requirements?.map((req, index) => (
                          <TableRow key={index}>
                            <TableCell>{req.testName}</TableCell>
                            <TableCell>{req.frequency}</TableCell>
                            <TableCell>
                              {req.alert.type} {req.alert.value} {req.alert.unit}
                            </TableCell>
                            <TableCell>{req.action}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(workflow)}
                  >
                    Modifier
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-red-500">
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce workflow ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteWorkflowMutation.mutate(workflow._id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WorkflowModal 
        isOpen={workflowModalOpen} 
        onClose={handleCloseModal}
        workflow={selectedWorkflow}
      />
    </div>
  );
}
