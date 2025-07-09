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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession) {
        // Fetch user role from public.techs table
        const { data: techData, error: techError } = await supabase
          .from('techs')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (techError && techError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("Error fetching user role:", techError);
          setUserRole(null); // No role found or error
        } else if (techData) {
          setUserRole(techData.role);
        } else {
          // If no tech profile, default to a generic role or 'unassigned'
          setUserRole('unassigned'); 
        }
      } else {
        setUserRole(null);
      }
      setIsLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) {
        supabase
          .from('techs')
          .select('role')
          .eq('id', initialSession.user.id)
          .single()
          .then(({ data: techData, error: techError }) => {
            if (techError && techError.code !== 'PGRST116') {
              console.error("Error fetching initial user role:", techError);
              setUserRole(null);
            } else if (techData) {
              setUserRole(techData.role);
            } else {
              setUserRole('unassigned');
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
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