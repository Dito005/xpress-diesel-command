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
        console.log("Session found for user ID:", currentSession.user.id);
        // Fetch user role from public.techs table
        const { data: techDataArray, error: techError } = await supabase
          .from('techs')
          .select('role')
          .eq('id', currentSession.user.id)
          .limit(1); // Use limit(1) instead of single() for more robust handling of no-rows-found

        if (techError) {
          console.error("Error fetching user role from techs table:", techError);
          console.error("Full techError object:", JSON.stringify(techError, null, 2));
          setUserRole('unassigned'); // Fallback on any error
          console.warn(`Failed to fetch role for user ${currentSession.user.id}. Assigning 'unassigned' role.`);
        } else if (techDataArray && techDataArray.length > 0 && techDataArray[0].role) {
          setUserRole(techDataArray[0].role);
          console.log(`User ${currentSession.user.id} role set to: ${techDataArray[0].role}`);
        } else {
          // This covers cases where data is empty array or role is null/undefined
          setUserRole('unassigned');
          console.warn(`User ${currentSession.user.id} tech profile not found or role is missing. Assigning 'unassigned' role.`);
        }
      } else {
        setUserRole(null);
        console.log("No active session. User role set to null.");
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