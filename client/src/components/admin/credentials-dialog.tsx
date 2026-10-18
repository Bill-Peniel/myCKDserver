import { useState } from 'react';
import { Check, Copy, KeyRound, TriangleAlert } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type DoctorCredentials = { name: string; email: string; temporaryPassword: string };

/**
 * Affiché uniquement quand l'e-mail d'identifiants n'a pas pu être envoyé :
 * l'administrateur transmet lui-même le mot de passe temporaire (visible une seule fois).
 */
export function CredentialsDialog({ credentials, onClose }: { credentials: DoctorCredentials | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!credentials) return;
    try {
      await navigator.clipboard.writeText(`Identifiant : ${credentials.email}\nMot de passe temporaire : ${credentials.temporaryPassword}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers indisponible : l'admin peut recopier le texte affiché
    }
  };

  return (
    <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
      {/* Ne se ferme que par une action explicite : le mot de passe ne sera plus jamais affiché.
          (Empêche aussi la fermeture immédiate quand le formulaire précédent rend le focus à la page.) */}
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning ring-1 ring-inset ring-warning/20">
            <KeyRound className="h-[18px] w-[18px]" />
          </span>
          <div className="space-y-1.5">
            <DialogTitle>Identifiants à transmettre</DialogTitle>
            <DialogDescription>
              L'e-mail n'a pas pu être envoyé à Dr. {credentials?.name}. Communiquez-lui ces identifiants de façon sécurisée.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Identifiant</span>
            <span className="truncate font-medium">{credentials?.email}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Mot de passe temporaire</span>
            <code className="rounded-md border bg-background px-2 py-1 font-mono text-[15px] font-semibold tracking-wide">
              {credentials?.temporaryPassword}
            </code>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          Ce mot de passe ne sera plus affiché. Le médecin pourra le changer dans Paramètres → Sécurité.
          Configurez EMAIL_USER et EMAIL_PASS sur le serveur pour un envoi automatique.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
          <Button onClick={onClose}>J'ai transmis les identifiants</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Interprète la réponse de création / renvoi d'identifiants */
export function readInvitation(doctor: any): DoctorCredentials | null {
  const invitation = doctor?.invitation;
  if (!invitation || invitation.emailSent || !invitation.temporaryPassword) return null;
  return {
    name: `${doctor.user.firstName} ${doctor.user.lastName}`,
    email: doctor.user.email,
    temporaryPassword: invitation.temporaryPassword,
  };
}
