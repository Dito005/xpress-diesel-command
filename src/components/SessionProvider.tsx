"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthStateChange = async (event: string, currentSession: Session | null) => {
      setSession(currentSession);
      if (currentSession) {
        // Fetch user role from public.techs table
        const { data: techData, error: techError } = await supabase
          .from('techs')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (techError) {
          // Log all errors, not just PGRST116, to help diagnose
          console.error("Error fetching user role from techs table:", techError);
          if (techError.code === 'PGRST116') { // No rows found
            setUserRole('unassigned');
            console.warn(`User ${currentSession.user.id} has no tech profile. Assigning 'unassigned' role.`);
          } else {
            // For other errors, default to unassigned but log the specific error
            setUserRole('unassigned');
            console.error(`Failed to fetch role for user ${currentSession.user.id}:`, techError.message);
          }
        } else if (techData) {
          setUserRole(techData.role);
        } else {
          // Fallback if data is null but no explicit error (shouldn't happen with .single())
          setUserRole('unassigned');
          console.warn(`User ${currentSession.user.id} tech profile found but role is null or undefined. Assigning 'unassigned' role.`);
        }
      } else {
        setUserRole(null);
      }
      setIsLoading(false); // Always set isLoading to false after auth state is processed
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthStateChange('INITIAL_SESSION', initialSession); // Process initial session
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