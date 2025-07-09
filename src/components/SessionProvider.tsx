"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Define UserRole type here as well, to be consistent with Index.tsx
type UserRole = "admin" | "manager" | "mechanic" | "road" | "parts" | "unassigned";

// Type guard function to check if a string is a valid UserRole
function isUserRole(role: string | null): role is UserRole {
  if (role === null) return false;
  const validRoles: UserRole[] = ["admin", "manager", "mechanic", "road", "parts", "unassigned"];
  return (validRoles as string[]).includes(role);
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  userRole: UserRole | null; // Changed type to UserRole | null
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null); // Changed type to UserRole | null

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
          .limit(1);

        if (techError) {
          console.error("Error fetching user role from techs table:", techError);
          console.error("Full techError object:", JSON.stringify(techError, null, 2));
          setUserRole('unassigned'); // Fallback on any error
          console.warn(`Failed to fetch role for user ${currentSession.user.id}. Assigning 'unassigned' role.`);
        } else if (techDataArray && techDataArray.length > 0 && techDataArray[0].role) {
          const fetchedRole = techDataArray[0].role;
          if (isUserRole(fetchedRole)) { // Validate the fetched role using the type guard
            setUserRole(fetchedRole);
            console.log(`User ${currentSession.user.id} role set to: ${fetchedRole}`);
          } else {
            // If the role from DB is not a valid UserRole, assign 'unassigned'
            setUserRole('unassigned');
            console.warn(`Fetched role '${fetchedRole}' for user ${currentSession.user.id} is invalid. Assigning 'unassigned' role.`);
          }
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