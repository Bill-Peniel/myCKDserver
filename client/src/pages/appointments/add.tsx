import { useState } from 'react';
import { useLocation } from 'wouter';
import AddAppointmentDialog from '@/components/appointments/add-dialog';
import AppointmentsPage from './index';

export default function AppointmentAdd() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const handleClose = () => {
    setIsDialogOpen(false);
    setLocation('/appointments');
  };

  // L'agenda reste visible derrière le dialogue
  return (
    <>
      <AppointmentsPage />
      <AddAppointmentDialog
        isOpen={isDialogOpen}
        onClose={handleClose}
      />
    </>
  );
}
