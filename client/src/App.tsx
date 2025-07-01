import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import RegisterPage from "@/pages/auth/register";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import Workflows from "@/pages/workflows";
import ChatbotPage from "@/pages/chatbot"; // Import ChatbotPage component


function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading, user } = useAuth();
  const [location, setLocation] = useLocation();
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
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated || (user && user.role === 'patient')) {
    return null;
  }

  return <Component {...rest} />;
}

function AdminRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading, user } = useAuth();
  const [location, setLocation] = useLocation();
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
        setLocation("/");
      }
    }
  }, [loading, isAuthenticated, user, setLocation, toast]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null;
  }

  return <Component {...rest} />;
}

function AuthRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login">
        <AuthRoute component={LoginPage} />
      </Route>
      <Route path="/register">
        <AuthRoute component={RegisterPage} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <AdminRoute component={() => {
          window.location.href = '/admin/dashboard';
          return null;
        }} />
      </Route>
      <Route path="/admin/dashboard">
        <AdminRoute component={() => (
          <AppLayout isAdmin>
            <AdminDashboard />
          </AppLayout>
        )} />
      </Route>
      <Route path="/admin/patients">
        <AdminRoute component={() => (
          <AppLayout isAdmin>
            <AdminPatientsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/admin/doctors">
        <AdminRoute component={() => (
          <AppLayout isAdmin>
            <AdminDoctorsPage />
          </AppLayout>
        )} />
      </Route>


      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
      </Route>
      <Route path="/patients/add">
        <ProtectedRoute component={() => (
          <AppLayout>
            <PatientAddEdit />
          </AppLayout>
        )} />
      </Route>
      <Route path="/patients/add-edit/:id">
        {(params) => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <PatientAddEdit id={params.id} />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/patients/:id">
        {(params) => (
          <ProtectedRoute component={() => (
            <AppLayout>
              <PatientDetails id={params.id} />
            </AppLayout>
          )} />
        )}
      </Route>

      <Route path="/patients">
        <ProtectedRoute component={() => (
          <AppLayout>
            <PatientsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/lab-results/add">
        <ProtectedRoute component={() => (
          <AppLayout>
            <LabResultAdd />
          </AppLayout>
        )} />
      </Route>
      <Route path="/lab-results">
        <ProtectedRoute component={() => (
          <AppLayout>
            <LabResultsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/appointments/add">
        <ProtectedRoute component={() => (
          <AppLayout>
            <AppointmentAdd />
          </AppLayout>
        )} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={() => (
          <AppLayout>
            <AppointmentsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={() => (
          <AppLayout>
            <NotificationsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={() => (
          <AppLayout>
            <SettingsPage />
          </AppLayout>
        )} />
      </Route>
      <Route path="/workflows">
        <ProtectedRoute component={() => (
          <AppLayout>
            <Workflows />
          </AppLayout>
        )} />
      </Route>

      <Route path="/chatbot">
        <ProtectedRoute component={() => (
          <AppLayout>
            <ChatbotPage />
          </AppLayout>
        )} />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;