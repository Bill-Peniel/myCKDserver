import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthState, AuthUser } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType extends AuthState {
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    userDetails: null
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if the user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
          const parsedAuth = JSON.parse(storedAuth);
          setAuthState(parsedAuth);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // If there's an error with the stored auth, clear it
        localStorage.removeItem('auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      const newAuthState: AuthState = {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          createdAt: data.user.createdAt,
        },
        token: data.token,
        isAuthenticated: true,
        userDetails: data.userDetails,
      };

      setAuthState(prev => ({...prev, ...newAuthState}));
      localStorage.setItem('auth', JSON.stringify({...authState, ...newAuthState}));

      // Redirection selon le rôle
      if (data.user?.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (data.user?.role === 'medecin') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login';
      }
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Identifiants invalides ou serveur indisponible",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        userDetails: null
      });
      localStorage.removeItem('auth');
      queryClient.clear();
      toast({
        title: "Veuillez vous reconnecter",
      });

      // Rediriger vers login et forcer le rechargement
      setTimeout(() => {
        window.location.href = '/login';
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Erreur lors de la déconnexion",
        description: "Veuillez réessayer",
        variant: "destructive",
      });
    }
  };

  const contextValue = {
    ...authState,
    loading,
    login,
    logout,
    setAuthState
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return {
    ...context,
    login: context.login,
    logout: context.logout,
    setAuthState: context.setAuthState
  };
}