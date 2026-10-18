import React, { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPatientsPage from "@/pages/admin/patients";
import AdminDoctorsPage from "@/pages/admin/doctors";
import PatientsPage from "@/pages/patients/index";

import PatientAddEdit from "@/pages/patients/add-edit";
import PatientDetails from "@/pages/patients/details";
import LabResultsPage from "@/pages/lab-results/index";
import LabResultAdd from "@/pages/lab-results/add";
import AppointmentsPage from "@/pages/appointments/index";
import AppointmentAdd from "@/pages/appointments/add";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/auth/login";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import Workflows from "@/pages/workflows";
import ChatbotPage from "@/pages/chatbot";
import LandingPage from "@/pages/landing";
import { ThemeProvider } from "@/lib/theme";
import { PageLoader } from "@/components/ui/loader";


// Les gardes reçoivent la page en `children` (élément stable) et non un composant créé
// à la volée : sinon chaque nouveau rendu (ex. un toast) remonterait toute la page.

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (user && user.role === 'patient') {
        toast({
          title: "Accès restreint",
          description: "Seuls les médecins et les administrateurs peuvent accéder à cette application.",
          variant: "destructive",
        });
        setLocation("/login");
      }
    }
  }, [loading, isAuthenticated, user, setLocation, toast]);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || (user && user.role === 'patient')) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (user && user.role !== 'admin') {
        toast({
          title: "Accès restreint",
          description: "Cette section est réservée à l'administrateur.",
          variant: "destructive",
        });
        setLocation("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, setLocation, toast]);

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null;
  }

  return <AppLayout isAdmin>{children}</AppLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <LandingPage />
      </Route>
      <Route path="/login">
        <AuthRoute><LoginPage /></AuthRoute>
      </Route>
      {/* Pas d'inscription publique : les comptes médecins sont créés par l'administrateur */}
      <Route path="/register">
        <Redirect to="/login" />
      </Route>

      {/* Espace administrateur */}
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/admin/dashboard">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/patients">
        <AdminRoute><AdminPatientsPage /></AdminRoute>
      </Route>
      <Route path="/admin/doctors">
        <AdminRoute><AdminDoctorsPage /></AdminRoute>
      </Route>

      {/* Espace médecin */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/patients/add">
        <ProtectedRoute><PatientAddEdit /></ProtectedRoute>
      </Route>
      <Route path="/patients/add-edit/:id">
        {(params) => <ProtectedRoute><PatientAddEdit id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/patients/:id">
        {(params) => <ProtectedRoute><PatientDetails id={params.id} /></ProtectedRoute>}
      </Route>
      <Route path="/patients">
        <ProtectedRoute><PatientsPage /></ProtectedRoute>
      </Route>
      <Route path="/lab-results/add">
        <ProtectedRoute><LabResultAdd /></ProtectedRoute>
      </Route>
      <Route path="/lab-results">
        <ProtectedRoute><LabResultsPage /></ProtectedRoute>
      </Route>
      <Route path="/appointments/add">
        <ProtectedRoute><AppointmentAdd /></ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute><AppointmentsPage /></ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute><NotificationsPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/workflows">
        <ProtectedRoute><Workflows /></ProtectedRoute>
      </Route>
      <Route path="/chatbot">
        <ProtectedRoute><ChatbotPage /></ProtectedRoute>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;