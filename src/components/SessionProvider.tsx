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
        console.error("Full techError object:", JSON.stringify(techError, null, 2));
        setUserRole('unassigned'); // Fallback on any error
        console.warn(`Failed to fetch role for user ${userId}. Assigning 'unassigned' role.`);
      } else if (techDataArray && techDataArray.length > 0 && techDataArray[0].role) {
        const fetchedRole = techDataArray[0].role;
        if (isUserRole(fetchedRole)) {
          setUserRole(fetchedRole);
          console.log(`User ${userId} role set to: ${fetchedRole}`);
        } else {
          setUserRole('unassigned');
          console.warn(`Fetched role '${fetchedRole}' for user ${userId} is invalid. Assigning 'unassigned' role.`);
        }
      } else {
        setUserRole('unassigned');
        console.warn(`User ${userId} tech profile not found or role is missing. Assigning 'unassigned' role.`);
      }
    };

    const handleAuthStateChange = (event: string, currentSession: Session | null) => {
      setSession(currentSession);
      setIsLoading(false); // Set isLoading to false immediately after session status is known

      if (currentSession) {
        console.log("Session found for user ID:", currentSession.user.id);
        fetchUserRole(currentSession.user.id); // Fetch role asynchronously
      } else {
        setUserRole(null);
        console.log("No active session. User role set to null.");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthStateChange('INITIAL_SESSION', initialSession);
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