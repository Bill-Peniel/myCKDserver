import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Check, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Patient, PatientLabResult, Appointment, LabTest, Doctor } from '@/lib/types';
import { formatDate, formatTime, getCKDStageColor, calculateAge } from '@/lib/utils';
import { determineProgressionRisk } from '@/lib/ckd-utils';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface GenerateReportProps {
  patient: Patient;
  trigger?: React.ReactNode;
}

export function GenerateReport({ patient, trigger }: GenerateReportProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportSections, setReportSections] = useState<ReportSection[]>([
    { id: "personalInfo", name: "Informations personnelles", enabled: true },
    { id: "medicalHistory", name: "Historique médical", enabled: true },
    { id: "labResults", name: "Résultats de laboratoire", enabled: true },
    { id: "appointments", name: "Rendez-vous", enabled: true },
    { id: "riskAssessment", name: "Évaluation des risques", enabled: true }
  ]);
  const [reportGenerated, setReportGenerated] = useState(false);

  // Fetch additional data needed for the report
  const { data: labResults } = useQuery<PatientLabResult[]>({
    queryKey: [`/api/patient-lab-results/patient/${patient.id}`],
    enabled: open,
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: [`/api/appointments/patient/${patient.id}`],
    enabled: open,
  });

  const { data: labTests } = useQuery<LabTest[]>({
    queryKey: ['/api/lab-tests'],
    enabled: open,
  });

  const { data: doctors } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
    enabled: open,
  });


  const handleSectionToggle = (sectionId: string) => {
    setReportSections(prevSections => {
      return prevSections.map(section => {
        if (section.id === sectionId) {
          return { ...section, enabled: !section.enabled };
        }
        return section;
      });
    });
  };

  const generatePDF = async () => {
    setGenerating(true);
    setReportGenerated(false);

    try {
      // Créer le document PDF en format A4
      const doc = new jsPDF({
        format: 'a4',
        unit: 'mm'
      });

      // Ajouter un en-tête stylisé
      doc.setFillColor(0, 71, 65); // Vert foncé professionnel
      doc.rect(0, 0, 210, 40, 'F');

      // Titre du rapport
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text('Rapport Médical Patient', 105, 20, { align: 'center' });

      // Informations du médecin
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Dr. ${patient.doctor?.user?.firstName} ${patient.doctor?.user?.lastName}`, 105, 28, { align: 'center' });

      // Date de génération
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 36, { align: 'center' });

      // Réinitialiser les couleurs pour le contenu
      doc.setTextColor(0, 0, 0);

      let yPos = 50;

      // Ajouter un style de page
      doc.setDrawColor(0, 71, 65);
      doc.setLineWidth(0.5);
      doc.line(15, 45, 195, 45);

      // Section d'identification du patient avec un style amélioré
      doc.setFillColor(240, 240, 240);
      doc.rect(15, yPos - 5, 180, 25, 'F');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 71, 65);
      doc.text('Identification du Patient', 20, yPos);
      yPos += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);

      // Utilisation d'une mise en page en colonnes
      const col1X = 20;
      const col2X = 110;

      doc.text(`ID Patient: P-${patient.id.toString().padStart(5, '0')}`, col1X, yPos);
      doc.text(`Email: ${patient.user.email}`, col2X, yPos);
      yPos += 7;

      doc.text(`Nom complet: ${patient.user.firstName} ${patient.user.lastName}`, col1X, yPos);
      yPos += 15;

      // Ajouter une ligne de séparation stylisée
      doc.setDrawColor(0, 71, 65);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(15, yPos - 5, 195, yPos - 5);
      doc.setLineDashPattern([], 0);

      // Personal Information Section
      if (reportSections.find(s => s.id === 'personalInfo')?.enabled) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 71, 65);
        doc.text('Informations Personnelles', 20, yPos);
        yPos += 10;

        // Add a background rectangle
        doc.setFillColor(245, 247, 250);
        doc.rect(15, yPos - 5, 180, 50, 'F');

        // Create two columns for better organization
        const leftCol = 25;
        const rightCol = 110;
        const lineHeight = 12;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);

        // Left column
        doc.text("Nom complet:", leftCol, yPos);
        doc.text("Age:", leftCol, yPos + lineHeight);
        doc.text("Date de naissance:", leftCol, yPos + lineHeight * 2);
        doc.text("Genre:", leftCol, yPos + lineHeight * 3);

        // Right column headers
        doc.text("Téléphone:", rightCol, yPos);
        doc.text("Adresse:", rightCol, yPos + lineHeight);

        // Add values in normal font
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        const age = calculateAge(patient.birthDate);
        doc.text(`${patient.user.firstName} ${patient.user.lastName}`, leftCol + 25, yPos);
        doc.text(`${age} ans`, leftCol + 25, yPos + lineHeight);
        doc.text(formatDate(patient.birthDate), leftCol + 35, yPos + lineHeight * 2);
        doc.text(patient.gender === 'M' ? 'Masculin' : 'Féminin', leftCol + 25, yPos + lineHeight * 3);

        doc.text(patient.phone || 'Non renseigné', rightCol + 25, yPos);
        doc.text(patient.address || 'Non renseignée', rightCol + 25, yPos + lineHeight);

        yPos += 55;
      }

      // Medical History Section
      if (reportSections.find(s => s.id === 'medicalHistory')?.enabled) {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 71, 65);
        doc.text('Historique Médical', 20, yPos);
        yPos += 10;

        // Add a background rectangle for medical history
        doc.setFillColor(245, 247, 250);
        doc.rect(15, yPos - 5, 180, 45, 'F');

        // Create two columns
        const leftCol = 25;
        const rightCol = 110;
        const lineHeight = 12;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);

        // Left column headers
        doc.text("Stade MRC:", leftCol, yPos);
        doc.text("DFG (eGFR):", leftCol, yPos + lineHeight);

        // Add values in normal font
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        doc.text(patient.ckdStage || 'Non défini', leftCol + 25, yPos);
        const lastDfg = labResults?.find(r => r.labTest.testName.toLowerCase().includes('dfg'))?.resultValue;
        doc.text(lastDfg ? `${lastDfg} mL/min/1.73m²` : (patient.lastEgfrValue ? `${patient.lastEgfrValue} mL/min/1.73m²` : 'Non mesuré'), leftCol + 25, yPos + lineHeight);


        yPos += 50;
      }

      // Risk Assessment Section
      if (reportSections.find(s => s.id === 'riskAssessment')?.enabled && patient.lastEgfrValue ) {
        doc.setFontSize(16);
        doc.text('Risk Assessment', 14, yPos);
        yPos += 10;

        const risk = determineProgressionRisk(patient.lastEgfrValue, patient.proteinuriaLevel);

        doc.setFontSize(12);
        doc.text(`CKD Progression Risk: ${risk}`, 14, yPos);
        yPos += 7;

        // Add risk explanation
        let riskExplanation = '';
        switch (risk) {
          case 'Low':
            riskExplanation = 'The patient has a low risk of CKD progression. Regular monitoring is recommended.';
            break;
          case 'Moderate':
            riskExplanation = 'The patient has a moderate risk of CKD progression. More frequent monitoring is advised.';
            break;
          case 'High':
            riskExplanation = 'The patient has a high risk of CKD progression. Close monitoring and management is necessary.';
            break;
          case 'Very High':
            riskExplanation = 'The patient has a very high risk of CKD progression. Specialist referral and intensive management is required.';
            break;
        }

        doc.text('Risk Explanation:', 14, yPos);
        yPos += 7;

        // Split the explanation into multiple lines if needed
        const splitText = doc.splitTextToSize(riskExplanation, 180);
        doc.text(splitText, 14, yPos);
        yPos += splitText.length * 7 + 5;
      }

      // Laboratory Results Section
      if (reportSections.find(s => s.id === 'labResults')?.enabled && labResults && labResults.length > 0 && labTests) {
        doc.setFontSize(16);
        doc.text('Laboratory Results', 14, yPos);
        yPos += 10;

        // Prepare data for the table
        const tableData = labResults.map(result => {
          const test = labTests.find(t => t._id === result.labTest._id);
          const value = parseFloat(result.resultValue.toString());
          const unit = result.labTest.unit || '';
          const min = result.labTest.normalMin ? parseFloat(result.labTest.normalMin.toString()) : undefined;
          const max = result.labTest.normalMax ? parseFloat(result.labTest.normalMax.toString()) : undefined;

          let message = '';
          let status = 'Normal';
          if (min !== undefined && max !== undefined) {
            if (value < min) status = 'Below Normal';
            else if (value > max) status = 'Above Normal';
          }
          const range = (min !== undefined && max !== undefined)
            ? `${min} - ${max} ${unit}`
            : 'Not specified';

          return [
            formatDate(result.resultDate),
            result.labTest.testName || `Test #${result.labTest._id}`,
            value,
            unit,
            range,
            status
          ];
        });

        // Add table with lab results
        autoTable(doc, {
          head: [['Date', 'Test', 'Valeur', 'Unité', 'Plage Normale', 'Statut']],
          body: tableData,
          startY: yPos,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [0, 71, 65],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { halign: 'center' },
            1: { fontStyle: 'bold' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' }
          },
          alternateRowStyles: {
            fillColor: [240, 245, 245]
          },
          margin: { top: 10, left: 15, right: 15 },
          tableWidth: 180
        });

        // Update yPos based on the table height
        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Check if need to add a new page for appointments
      if (yPos > 250 && reportSections.find(s => s.id === 'appointments')?.enabled && appointments && appointments.length > 0) {
        doc.addPage();
        yPos = 20;
      }

      // Appointments Section
      if (reportSections.find(s => s.id === 'appointments')?.enabled && appointments && appointments.length > 0 && doctors) {
        doc.setFontSize(16);
        doc.text('Appointments', 14, yPos);
        yPos += 10;

        // Upcoming appointments
        const upcomingAppointments = appointments
          .filter(a => new Date(a.appointmentDate) >= new Date() && a.status !== 'cancelled')
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

        if (upcomingAppointments.length > 0) {
          doc.setFontSize(14);
          doc.text('Upcoming Appointments', 14, yPos);
          yPos += 8;

          // Prepare data for the table
          const tableData = upcomingAppointments.map(appointment => {
            const doctor = doctors.find(d => d.id === appointment.doctorId);
            const doctorName = doctor
              ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
              : 'Unknown Doctor';

            return [
              formatDate(appointment.appointmentDate),
              formatTime(appointment.appointmentDate),
              doctorName,
              appointment.purpose || 'General consultation',
              appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
            ];
          });

          // Add table with upcoming appointments
          autoTable(doc, {
            head: [['Date', 'Time', 'Doctor', 'Purpose', 'Status']],
            body: tableData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
          });

          // Update yPos based on the table height
          yPos = (doc as any).lastAutoTable.finalY + 10;
        }

        // Past appointments (last 5)
        const pastAppointments = appointments
          .filter(a => new Date(a.appointmentDate) < new Date() || a.status === 'cancelled')
          .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
          .slice(0, 5);

        if (pastAppointments.length > 0) {
          // Check if need to add a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(14);
          doc.text('Past Appointments (Last 5)', 14, yPos);
          yPos += 8;

          // Prepare data for the table
          const tableData = pastAppointments.map(appointment => {
            const doctor = doctors.find(d => d.id === appointment.doctorId);
            const doctorName = doctor
              ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
              : 'Unknown Doctor';

            return [
              formatDate(appointment.appointmentDate),
              formatTime(appointment.appointmentDate),
              doctorName,
              appointment.purpose || 'General consultation',
              appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
            ];
          });

          // Add table with past appointments
          autoTable(doc, {
            head: [['Date', 'Time', 'Doctor', 'Purpose', 'Status']],
            body: tableData,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [158, 158, 158] },
            alternateRowStyles: { fillColor: [240, 240, 240] }
          });
        }
      }

      // Ajouter un pied de page stylisé avec numérotation
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Barre de pied de page
        doc.setFillColor(0, 71, 65);
        doc.rect(0, doc.internal.pageSize.height - 20, 210, 20, 'F');

        // Texte du pied de page
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        // Informations de confidentialité à gauche
        doc.text(`Dossier Médical Confidentiel - ${patient.user.firstName} ${patient.user.lastName}`, 15, doc.internal.pageSize.height - 8);

        // Numéro de page à droite
        doc.text(`Page ${i} sur ${pageCount}`, 195, doc.internal.pageSize.height - 8, { align: 'right' });

        // Date de génération au centre
        doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, doc.internal.pageSize.height - 8, { align: 'center' });
      }

      // Save the PDF
      doc.save(`patient-report-${patient.id}.pdf`);
      setReportGenerated(true);
    } catch (error) {
      console.error('Error generating PDF report:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Générer un rapport</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Générer un rapport patient</DialogTitle>
          <DialogDescription>
            {patient.user ? (
              <>Créer un rapport PDF complet pour <span className="font-medium text-foreground">{patient.user.firstName} {patient.user.lastName}</span></>
            ) : (
              'Créer un rapport patient complet'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div>
            <h3 className="mb-4 text-sm font-medium leading-none">Sections du rapport :</h3>
            <div className="rounded-md border bg-card p-4 space-y-4">
              {reportSections.map((section) => (
                <div key={section.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                    className="h-5 w-5 border-2 border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
                  />
                  <label
                    htmlFor={section.id}
                    className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {section.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {reportGenerated && (
            <div className="flex items-center space-x-2 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg text-green-800 dark:text-green-300 animate-in fade-in duration-300">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">Report generated successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={generating}
          >
            Annuler
          </Button>
          <Button type="submit" onClick={generatePDF} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération en cours...
              </>
            ) : (
              'Générer le rapport'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReportSection {
  id: string;
  name: string;
  enabled: boolean;
}