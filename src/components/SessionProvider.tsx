"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define UserRole type here as well, to be consistent with Index.tsx
type UserRole = "admin" | "manager" | "tech" | "road" | "parts" | "unassigned";

// Type guard function to check if a string is a valid UserRole
function isUserRole(role: string | null): role is UserRole {
  if (role === null) return false;
  const validRoles: UserRole[] = ["admin", "manager", "tech", "road", "parts", "unassigned"];
  return (validRoles as string[]).includes(role);
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      const { data: techDataArray, error: techError } = await supabase
        .from('techs')
        .select('role')
        .eq('id', userId)
        .limit(1);

      if (techError) {
        console.error("Error fetching user role from techs table:", techError);
        setUserRole('unassigned');
      } else if (techDataArray && techDataArray.length > 0 && isUserRole(techDataArray[0].role)) {
        setUserRole(techDataArray[0].role);
      } else {
        setUserRole('unassigned');
        console.warn(`User ${userId} tech profile not found or role is missing. Assigning 'unassigned' role.`);
      }
    };

    // This function will handle setting session, role, and loading state.
    const setAuthData = async (session: Session | null) => {
      setSession(session);
      if (session) {
        await fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthData(session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthData(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, userRole }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};