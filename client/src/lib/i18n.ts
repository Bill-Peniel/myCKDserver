
import { create } from 'zustand';

interface I18nStore {
  language: 'fr';
  setLanguage: (language: 'fr') => void;
}

const translations = {
  // Auth
  'login': 'Connexion',
  'register': 'Inscription',
  'email': 'Email',
  'password': 'Mot de passe',
  'logout': 'Déconnexion',
  'forgot_password': 'Mot de passe oublié ?',
  'no_account': 'Pas encore de compte ?',
  'has_account': 'Déjà un compte ?',
  'sign_up': "S'inscrire",
  'sign_in': 'Se connecter',

  // Navigation
  'dashboard': 'Tableau de bord',
  'patients': 'Patients',
  'appointments': 'Rendez-vous',
  'lab_results': 'Résultats laboratoire',
  'notifications': 'Notifications',
  'settings': 'Paramètres',

  // Dashboard
  'welcome_back': 'Bon retour',
  'total_patients': 'Total patients',
  'upcoming_appointments': 'Prochains rendez-vous',
  'recent_lab_results': 'Résultats récents',
  'alerts': 'Alertes',
  'recent_patients': 'Patients récents',
  'view_all': 'Voir tout',
  'no_appointments': 'Aucun rendez-vous',
  'no_results': 'Aucun résultat',

  // Patients
  'add_patient': 'Ajouter un patient',
  'edit_patient': 'Modifier le patient',
  'patient_details': 'Détails du patient',
  'medical_history': 'Historique médical',
  'contact_info': 'Informations de contact',
  'save_patient': 'Enregistrer le patient',
  'delete_patient': 'Supprimer le patient',
  
  // Appointments
  'new_appointment': 'Nouveau rendez-vous',
  'appointment_date': 'Date du rendez-vous',
  'appointment_time': 'Heure du rendez-vous',
  'appointment_type': 'Type de rendez-vous',
  'appointment_notes': 'Notes',
  'save_appointment': 'Enregistrer le rendez-vous',
  'cancel_appointment': 'Annuler le rendez-vous',

  // Lab Results
  'new_result': 'Nouveau résultat',
  'test_type': 'Type de test',
  'test_date': 'Date du test',
  'test_results': 'Résultats',
  'save_results': 'Enregistrer les résultats',
  'generate_report': 'Générer un rapport',

  // Settings
  'profile': 'Profil',
  'notifications_settings': 'Notifications',
  'theme': 'Thème',
  'language': 'Langue',
  'save_changes': 'Enregistrer',
  'saving': 'Enregistrement...',
  'firstName': 'Prénom',
  'lastName': 'Nom',
  'currentPassword': 'Mot de passe actuel',
  'newPassword': 'Nouveau mot de passe',
  'confirmPassword': 'Confirmer le mot de passe',
  'profile_updated': 'Profil mis à jour',
  'password_changed': 'Mot de passe modifié',
  'preferences_updated': 'Préférences mises à jour',

  // Common
  'search': 'Rechercher',
  'actions': 'Actions',
  'edit': 'Modifier',
  'delete': 'Supprimer',
  'cancel': 'Annuler',
  'confirm': 'Confirmer',
  'loading': 'Chargement...',
  'error': 'Erreur',
  'success': 'Succès',
  'no_data': 'Aucune donnée disponible',
  'back': 'Retour',
  'next': 'Suivant',
  'previous': 'Précédent'
};

export const useI18n = create<I18nStore>((set) => ({
  language: 'fr',
  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },
}));

export const t = (key: keyof typeof translations): string => {
  return translations[key] || key;
};
