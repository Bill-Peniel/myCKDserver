import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import AddAppointmentDialog from '@/components/appointments/add-dialog';

export default function AppointmentAdd() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleClose = () => {
    setIsDialogOpen(false);
    setLocation('/appointments');
  };

  return (
    <AddAppointmentDialog
      isOpen={isDialogOpen}
      onClose={handleClose}
    />
  );
}